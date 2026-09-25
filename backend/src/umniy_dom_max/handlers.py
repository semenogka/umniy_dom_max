import fastapi
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import requests
from umniy_dom_max.db import repository
from umniy_dom_max.dependencies import get_appeal_agent, get_db, get_settings
from umniy_dom_max.llm import AppealAgent
from umniy_dom_max.settings import Settings
from umniy_dom_max.schemas import AddressIn, AppealIn, AppealOut, DemoUserIn, HouseOut, StatusIn, UserOut, HouseDetailOut, MessageIn, MessageOut, AppealDetailedOut
from loguru import logger

router = fastapi.APIRouter()

# мок авторизации юзера
@router.post("/users/demo", response_model=UserOut)
async def demo_create_user(data: DemoUserIn, db: AsyncSession = Depends(get_db)):
    user = await repository.get_user_full(db, data.user_id)
    if user:
        return user

    houses = await repository.get_random_houses(db, 2)
    if not houses:
        raise HTTPException(500, "No houses in DB - засейте houses")

    return await repository.create_user(db, data.user_id, data.name, data.chat_id, houses)

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
        raise HTTPException(500, f"LLM error: {e}") from e

    user = await repository.get_user_with_houses(db, data.user_id)
    if not user:
        raise HTTPException(404, "Not found user")
    if not any(h.address == data.address for h in user.houses):
        raise HTTPException(403, "Address not linked to user")

    bot_text = f"Тип: {classification.problem_type}\nОтветственный: {classification.responsible_org}\n{classification.deadline_text}\nПлан: {classification.action_plan}"
    return await repository.create_appeal(db, user.id, data.address, data.text, data.attachments, classification, bot_text)

# обновить статус обращения
@router.patch("/appeals/{appeal_id}/update", response_model=AppealOut)
async def update_appeal_status(
    appeal_id: int,
    data: StatusIn,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    appeal = await repository.get_appeal(db, appeal_id)
    if not appeal:
        raise HTTPException(404, "Not found")
    old_status = appeal.status
    changed = old_status != data.status
    await repository.set_appeal_status(db, appeal, data.status, f"Статус изменён: {old_status} → {data.status}" if changed else None)
    # уведа в чат
    if changed:
        try:
            user = await repository.get_user(db, appeal.author_id)
            chat_id = user.max_chat_id
            requests.post(f"{settings.max_api_url}/messages",
                params={"chat_id":chat_id}, headers={"Authorization": settings.max_token},
                json={"text": f"Статус обращения №{appeal.id} изменён на {data.status}"}, timeout=5)
        except Exception:
            logger.exception("не получилось уведомить в бота")

    return appeal

# получаем все обращения с дома.
@router.get("/appeals", response_model=list[AppealOut])
async def list_address_appeals(address: str, db: AsyncSession = Depends(get_db)):
    return await repository.list_appeals_by_address(db, address)

# получаем обращение по id
@router.get("/appeals/{appeal_id}", response_model=AppealDetailedOut)
async def get_appeal(appeal_id: int, db: AsyncSession = Depends(get_db)):
    a = await repository.get_appeal_detailed(db, appeal_id)
    if not a:
        raise HTTPException(404, "Not found")
    return a

# отправляем сообщение в обращение.
@router.post("/appeals/{appeal_id}/message", response_model=MessageOut)
async def send_message_appeal(appeal_id:int, data:MessageIn, db:AsyncSession=Depends(get_db)):
    appeal = await repository.get_appeal(db, appeal_id)
    if not appeal: raise HTTPException(404)
    bot_text = f"Статус №{appeal.id}: {appeal.status}\n{appeal.deadline_text or ''}"
    return await repository.add_appeal_message(db, appeal.id, data.sender, data.text, data.attachments, bot_text)

# получаем все дома юзера
@router.get("/users/{user_id}/houses", response_model=list[HouseOut])
async def list_user_houses(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await repository.get_user_with_houses(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user.houses

# информация о юзере
@router.get("/users/{user_id}", response_model=UserOut)
async def get_user_info(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await repository.get_user_full(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user

# получаем все обращения пользователя с сообщениями
@router.get("/users/{user_id}/appeals", response_model=list[AppealDetailedOut])
async def list_user_appeals(user_id:int, db:AsyncSession=Depends(get_db)):
    return await repository.list_user_appeals(db, user_id, with_messages=True)

# получаем все обращения пользователя кратко
@router.get("/users/{user_id}/appeals/short", response_model=list[AppealOut])
async def list_user_appeals_short(user_id:int, db:AsyncSession=Depends(get_db)):
    return await repository.list_user_appeals(db, user_id)

# добавить дом
@router.post("/houses", response_model=HouseOut)
async def add_house(data: AddressIn, db: AsyncSession = Depends(get_db)):
    if await repository.get_house_by_address(db, data.address):
        raise HTTPException(400, "House already exists")
    return await repository.create_house(db, data.address)

# посмотреть все дома
@router.get("/houses", response_model=list[HouseOut])
async def list_houses(db: AsyncSession = Depends(get_db)):
    return await repository.list_houses(db)

# получаем информацию о доме с сообщениями
@router.get("/houses/{house_id}", response_model=HouseDetailOut)
async def get_house_info(house_id: int, db: AsyncSession = Depends(get_db)):
    house = await repository.get_house_detailed(db, house_id)
    if not house:
        raise HTTPException(404, "Not found")
    return house

# отправка сообщений в дом
@router.post("/houses/{house_id}/message", response_model=MessageOut)
async def send_message(house_id: int, data: MessageIn, db: AsyncSession = Depends(get_db)):
    house = await repository.get_house(db, house_id)
    if not house:
        raise HTTPException(404, "Not found")
    return await repository.add_house_message(db, house.id, data.sender, data.text, data.attachments)
