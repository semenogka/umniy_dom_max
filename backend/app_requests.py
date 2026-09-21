import json
import os
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import AsyncSessionLocal, init_db, async_engine
from db.models import User, Appeal, House, AppealMessage
from gpt_client import GPTClient

SYSTEM_PROMPT = """Ты — классификатор обращений жителей.

Задача: по тексту обращения определи и верни ТОЛЬКО валидный JSON без markdown и пояснений.

Житель сообщает проблему — система сама определяет ответственного, объясняет порядок действий и сопровождает решение до результата. Житель не должен думать: куда обращаться, кто отвечает, как составить обращение, в какие сроки ответят.

Верни JSON со строгой схемой:
{
  "problem_type": "тип проблемы: освещение подъезда | ЖКХ | дороги | мусор | благоустройство | водоснабжение | отопление | лифт | другая",
  "urgency": "низкий | средний | высокий | критичный",
  "responsible_org": "ответственная организация: управляющая компания | администрация города | водоканал | электросети | дорожная служба | региональный оператор ТКО | другая",
  "deadline_days": число,
  "deadline_text": "Срок устранения: до X дней",
  "action_plan": "краткий порядок действий 1-2 шага"
}

Правила:
- urgency: критичный = угроза жизни/здоровью, высокий = нет света/воды/тепла, средний = мусор/ямы, низкий = косметика
- deadline_days: критичный 1, высокий 3, средний 7, низкий 14 (если иное не по нормативу)
- Отвечай только JSON, без ```json
"""

GPT_TOKEN = os.getenv("GPT_TOKEN") or os.getenv("GPT_API_KEY") or os.getenv("OPENAI_API_KEY")
if not GPT_TOKEN:
    raise RuntimeError("GPT_TOKEN не найден в backend/.env")
gpt = GPTClient(GPT_TOKEN)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Hack MAX API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AppealIn(BaseModel):
    text: str
    from_user_id: int
    from_name: str
    address: str

class StatusIn(BaseModel):
    status: str

class HouseOut(BaseModel):
    id: int
    address: str
    class Config:
        from_attributes = True

class AddressIn(BaseModel):
    address: str

class MessageOut(BaseModel):
    id:int; sender:str; text:str; is_read:bool; created_at:datetime
    class Config: from_attributes=True

class AppealOut(BaseModel):
    id:int; text:str; status:str; author_id:int
    appeal_address:str|None; organization:str|None
    problem_type:str|None; urgency:str|None
    deadline_days:int|None; deadline_text:str|None; action_plan:str|None
    created_at:datetime|None
    messages:list[MessageOut]=[] # <-- главное
    class Config: from_attributes=True

class UserOut(BaseModel):
    id: int
    name: str
    houses: list[HouseOut] = []
    appeals: list[AppealOut] = []
    class Config:
        from_attributes = True

class DemoUserIn(BaseModel):
    from_user_id: int
    from_name: str
    
# мок авторизации юзера
@app.post("/users/demo", response_model=UserOut)
async def demo_create_user(data: DemoUserIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.houses), selectinload(User.appeals)).where(User.id == data.from_user_id))
    user = result.scalars().first()
    if user:
        return user

    house = (await db.execute(select(House).order_by(func.random()).limit(1))).scalars().first()
    if not house:
        raise HTTPException(500, "No houses in DB - засейте houses")

    user = User(id=data.from_user_id, name=data.from_name)
    user.houses.append(house)
    db.add(user)
    await db.commit()
    result = await db.execute(select(User).options(selectinload(User.houses), selectinload(User.appeals)).where(User.id == user.id))
    return result.scalars().first()

# создает обращение
@app.post("/appeals", response_model=AppealOut)
async def create_appeal(data: AppealIn, db: AsyncSession = Depends(get_db)):
    try:
        raw = await gpt.llm_request([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": data.text}
        ])
        llm_data = json.loads(raw)
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}")

    result = await db.execute(select(User).options(selectinload(User.houses)).where(User.id == data.from_user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "Not found user")
    if not any(h.address == data.address for h in user.houses):
        raise HTTPException(403, "Address not linked to user")

    appeal = Appeal(
        text=data.text,
        status="новое",
        author_id=user.id,
        appeal_address=data.address,
        organization=llm_data.get("responsible_org"),
        problem_type=llm_data.get("problem_type"),
        urgency=llm_data.get("urgency"),
        deadline_days=llm_data.get("deadline_days"),
        deadline_text=llm_data.get("deadline_text"),
        action_plan=llm_data.get("action_plan"),
    )
    db.add(appeal)
    await db.flush() 
    db.add_all([
        AppealMessage(appeal_id=appeal.id, sender="user", text=data.text),
        AppealMessage(appeal_id=appeal.id, sender="bot", text=f"Тип: {llm_data.get('problem_type','-')}\nОтветственный: {llm_data.get('responsible_org','-')}\n{llm_data.get('deadline_text','')}\nПлан: {llm_data.get('action_plan','-')}"),
    ])
    await db.commit()
    # перезагрузить с messages для ответа
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.id == appeal.id))
    return result.scalars().first()

# получаем все обращения с дома.
@app.get("/appeals", response_model=list[AppealOut])
async def list_address_appeals(address: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.appeal_address == address).order_by(Appeal.created_at.desc()))
    return result.scalars().all()

# получаем все обращения пользователя
@app.get("/users/{user_id}/appeals", response_model=list[AppealOut])
async def list_user_appeals(user_id:int, db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.author_id==user_id).order_by(Appeal.created_at.desc()))
    return result.scalars().all()

# получаем обращение по id
@app.get("/appeals/{appeal_id}", response_model=AppealOut)
async def get_appeal(appeal_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.id == appeal_id))
    a = result.scalars().first()
    if not a:
        raise HTTPException(404, "Not found")
    return a

# получаем все дома юзера
@app.get("/users/{user_id}/houses", response_model=list[HouseOut])
async def list_user_houses(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.houses)).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "Not found")
    return user.houses

# информация о юзере
@app.get("/users/{user_id}", response_model=UserOut)
async def get_user_info(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.houses), selectinload(User.appeals)).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "Not found")
    return user

# обновить статус обращения
@app.patch("/appeals/{appeal_id}", response_model=AppealOut)
async def update_appeal_status(appeal_id: int, data: StatusIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.id == appeal_id))
    appeal = result.scalars().first()
    if not appeal:
        raise HTTPException(404, "Not found")
    old_status = appeal.status
    appeal.status = data.status
    # уведа в чат
    if old_status != data.status:
        db.add(AppealMessage(appeal_id=appeal.id, sender="system", text=f"Статус изменён: {old_status} → {data.status}"))
    await db.commit()
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.id == appeal_id))
    return result.scalars().first()

# добавить дом
@app.post("/houses", response_model=HouseOut)
async def add_house(data: AddressIn, db: AsyncSession = Depends(get_db)):
    if (await db.execute(select(House).where(House.address == data.address))).scalars().first():
        raise HTTPException(400, "House already exists")
    house = House(address=data.address)
    db.add(house)
    await db.commit()
    await db.refresh(house)
    return house

# посмотреть все дома
@app.get("/houses", response_model=list[HouseOut])
async def list_houses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(House))
    return result.scalars().all()
