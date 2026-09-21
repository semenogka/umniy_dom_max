import fastapi
from fastapi import Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from umniy_dom_max.db.models import Appeal, AppealMessage, House, User
from umniy_dom_max.dependencies import get_appeal_agent, get_db
from umniy_dom_max.llm import AppealAgent
from umniy_dom_max.schemas import AddressIn, AppealIn, AppealOut, DemoUserIn, HouseOut, StatusIn, UserOut

router = fastapi.APIRouter()


# мок авторизации юзера
@router.post("/users/demo", response_model=UserOut)
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
@router.post("/appeals", response_model=AppealOut)
async def create_appeal(
    data: AppealIn,
    db: AsyncSession = Depends(get_db),
    agent: AppealAgent = Depends(get_appeal_agent),
):
    try:
        classification = (await agent.run(data.text)).output
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
        organization=classification.responsible_org,
        problem_type=classification.problem_type,
        urgency=classification.urgency,
        deadline_days=classification.deadline_days,
        deadline_text=classification.deadline_text,
        action_plan=classification.action_plan,
    )
    db.add(appeal)
    await db.flush() 
    db.add_all([
        AppealMessage(appeal_id=appeal.id, sender="user", text=data.text),
        AppealMessage(appeal_id=appeal.id, sender="bot", text=f"Тип: {classification.problem_type}\nОтветственный: {classification.responsible_org}\n{classification.deadline_text}\nПлан: {classification.action_plan}"),
    ])
    await db.commit()
    # перезагрузить с messages для ответа
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.id == appeal.id))
    return result.scalars().first()

# получаем все обращения с дома.
@router.get("/appeals", response_model=list[AppealOut])
async def list_address_appeals(address: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.appeal_address == address).order_by(Appeal.created_at.desc()))
    return result.scalars().all()

# получаем все обращения пользователя
@router.get("/users/{user_id}/appeals", response_model=list[AppealOut])
async def list_user_appeals(user_id:int, db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.author_id==user_id).order_by(Appeal.created_at.desc()))
    return result.scalars().all()

# получаем обращение по id
@router.get("/appeals/{appeal_id}", response_model=AppealOut)
async def get_appeal(appeal_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages)).where(Appeal.id == appeal_id))
    a = result.scalars().first()
    if not a:
        raise HTTPException(404, "Not found")
    return a

# получаем все дома юзера
@router.get("/users/{user_id}/houses", response_model=list[HouseOut])
async def list_user_houses(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.houses)).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "Not found")
    return user.houses

# информация о юзере
@router.get("/users/{user_id}", response_model=UserOut)
async def get_user_info(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.houses), selectinload(User.appeals)).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "Not found")
    return user

# обновить статус обращения
@router.patch("/appeals/{appeal_id}", response_model=AppealOut)
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
@router.post("/houses", response_model=HouseOut)
async def add_house(data: AddressIn, db: AsyncSession = Depends(get_db)):
    if (await db.execute(select(House).where(House.address == data.address))).scalars().first():
        raise HTTPException(400, "House already exists")
    house = House(address=data.address)
    db.add(house)
    await db.commit()
    await db.refresh(house)
    return house

# посмотреть все дома
@router.get("/houses", response_model=list[HouseOut])
async def list_houses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(House))
    return result.scalars().all()
