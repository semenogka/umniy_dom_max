import fastapi
from fastapi import Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import requests
from umniy_dom_max.db.models import Appeal, AppealMessage, House, User, HouseMessage, MessageAttachment
from umniy_dom_max.dependencies import get_appeal_agent, get_db
from umniy_dom_max.llm import AppealAgent
from umniy_dom_max.settings import Settings
from umniy_dom_max.schemas import AddressIn, AppealIn, AppealOut, DemoUserIn, HouseOut, StatusIn, UserOut, HouseDetailOut, MessageIn, MessageOut, AppealDetailedOut
from loguru import logger

router = fastapi.APIRouter()
settings = Settings()

# мок авторизации юзера
@router.post("/users/demo", response_model=UserOut)
async def demo_create_user(data: DemoUserIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.houses), selectinload(User.appeals)).where(User.id == data.user_id))
    user = result.scalars().first()
    if user:
        return user

    house = (await db.execute(select(House).order_by(func.random()).limit(1))).scalars().first()
    house1 = (await db.execute(select(House).order_by(func.random()).limit(1))).scalars().first()
    if not house:
        raise HTTPException(500, "No houses in DB - засейте houses")

    user = User(id=data.user_id, name=data.name, max_chat_id=data.chat_id)
    user.houses.append(house)
    user.houses.append(house1)
    db.add(user)
    await db.commit()
    result = await db.execute(select(User).options(selectinload(User.houses), selectinload(User.appeals)).where(User.id == user.id))
    return result.scalars().first()

# создает обращение
@router.post("/appeals/create", response_model=AppealDetailedOut)
async def create_appeal(
    data: AppealIn,
    db: AsyncSession = Depends(get_db),
    agent: AppealAgent = Depends(get_appeal_agent),
):
    try:
        classification = (await agent.run(data.text)).output
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}")

    result = await db.execute(select(User).options(selectinload(User.houses)).where(User.id == data.user_id))
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
    user_msg=AppealMessage(appeal_id=appeal.id,sender="user",text=data.text)
    bot_msg=AppealMessage(appeal_id=appeal.id, sender="bot", text=f"Тип: {classification.problem_type}\nОтветственный: {classification.responsible_org}\n{classification.deadline_text}\nПлан: {classification.action_plan}")
    db.add(user_msg)
    db.add(bot_msg)
    await db.flush()
    
    for i,b64 in enumerate(data.attachments or []):
        db.add(MessageAttachment(appeal_message_id=user_msg.id, url=b64, ord=i))
    await db.commit()
    # перезагрузить с messages для ответа
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages).selectinload(AppealMessage.attachments)).where(Appeal.id == appeal.id))
    return result.scalars().first()

# обновить статус обращения
@router.patch("/appeals/{appeal_id}/update", response_model=AppealOut)
async def update_appeal_status(appeal_id: int, data: StatusIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).where(Appeal.id == appeal_id))
    appeal = result.scalars().first()
    if not appeal:
        raise HTTPException(404, "Not found")
    old_status = appeal.status
    appeal.status = data.status
    # уведа в чат
    if old_status != data.status:
        db.add(AppealMessage(appeal_id=appeal.id, sender="system", text=f"Статус изменён: {old_status} → {data.status}"))
        try:
            user = (await db.execute(select(User).where(User.id==appeal.author_id))).scalars().first()
            chat_id = getattr(user, "max_chat_id")
            requests.post(f"{settings.max_api_url}/messages",
                params={"chat_id":chat_id}, headers={"Authorization": settings.max_token},
                json={"text": f"Статус обращения №{appeal.id} изменён на {data.status}"}, timeout=5)
        except:
            logger.info("не получилось уведомить в бота")

    await db.commit()

    result = await db.execute(select(Appeal).where(Appeal.id == appeal_id))

    return result.scalars().first()

# получаем все обращения с дома.
@router.get("/appeals", response_model=list[AppealOut])
async def list_address_appeals(address: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).where(Appeal.appeal_address == address).order_by(Appeal.created_at.desc()))
    return result.scalars().all()

# получаем обращение по id
@router.get("/appeals/{appeal_id}", response_model=AppealDetailedOut)
async def get_appeal(appeal_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appeal).options(selectinload(Appeal.messages).selectinload(AppealMessage.attachments)).where(Appeal.id == appeal_id))
    a = result.scalars().first()
    if not a:
        raise HTTPException(404, "Not found")
    return a

# отправляем сообщение в обращение.
@router.post("/appeals/{appeal_id}/message", response_model=MessageOut)
async def send_message_appeal(appeal_id:int, data:MessageIn, db:AsyncSession=Depends(get_db)):
    appeal = (await db.execute(select(Appeal).where(Appeal.id==appeal_id))).scalars().first()
    if not appeal: raise HTTPException(404)
    msg = AppealMessage(appeal_id=appeal.id, sender=data.sender, text=data.text)
    db.add(msg); await db.flush()
    for i,b64 in enumerate(data.attachments or []):
        db.add(MessageAttachment(appeal_message_id=msg.id, url=b64, ord=i))
    bot = AppealMessage(appeal_id=appeal.id, sender="bot",
        text=f"Статус №{appeal.id}: {appeal.status}\n{appeal.deadline_text or ''}")
    db.add(bot); await db.commit()
    result = await db.execute(select(AppealMessage).options(selectinload(AppealMessage.attachments)).where(AppealMessage.id==msg.id))
    return result.scalars().first()

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

# получаем все обращения пользователя с сообщениями
@router.get("/users/{user_id}/appeals", response_model=list[AppealDetailedOut])
async def list_user_appeals(user_id:int, db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(Appeal).options(selectinload(Appeal.messages).selectinload(AppealMessage.attachments)).where(Appeal.author_id==user_id).order_by(Appeal.created_at.desc()))
    return result.scalars().all()

# получаем все обращения пользователя кратко
@router.get("/users/{user_id}/appeals/short", response_model=list[AppealOut])
async def list_user_appeals_short(user_id:int, db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(Appeal).where(Appeal.author_id==user_id).order_by(Appeal.created_at.desc()))
    return result.scalars().all()

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

# получаем информацию о доме с сообщениями
@router.get("/houses/{house_id}", response_model=HouseDetailOut)
async def get_house_info(house_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(House).options(selectinload(House.messages).selectinload(HouseMessage.attachments)).where(House.id == house_id))
    house = result.scalars().first()
    if not house:
        raise HTTPException(404, "Not found")
    return house

# отправка сообщений в дом
@router.post("/houses/{house_id}/message", response_model=MessageOut)
async def send_message(house_id: int, data: MessageIn, db: AsyncSession = Depends(get_db)):
    house = (await db.execute(select(House).where(House.id==house_id))).scalars().first()
    if not house:
        raise HTTPException(404, "Not found")
    msg = HouseMessage(house_id=house.id, sender=data.sender, text=data.text)
    db.add(msg)
    await db.flush()
    for i, b64 in enumerate(data.attachments or []):
        db.add(MessageAttachment(house_message_id=msg.id, url=b64, ord=i))
    await db.commit()
    
    result = await db.execute(select(HouseMessage).options(selectinload(HouseMessage.attachments)).where(HouseMessage.id==msg.id))
    return result.scalars().first()