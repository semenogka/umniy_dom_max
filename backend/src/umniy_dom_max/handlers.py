import asyncio

import fastapi
import requests
from fastapi import HTTPException
from loguru import logger
from datetime import datetime
from umniy_dom_max.mail import Mail
from umniy_dom_max.db import repository
from umniy_dom_max.settings import Settings
from umniy_dom_max.dependencies import AppealAgentDep, DbSession, SettingsDep
from umniy_dom_max import html as html_templates
from umniy_dom_max.schemas import (
    AddressIn,
    AppealDetailedOut,
    AppealIn,
    AppealOut,
    DemoUserIn,
    HouseDetailOut,
    HouseOut,
    MessageIn,
    MessageOut,
    StatusIn,
    UserOut,
)
router = fastapi.APIRouter()
settings = Settings()
mail = Mail(settings.mail_host, settings.mail_user, settings.mail_password)

# мок авторизации юзера
@router.post("/users/demo", response_model=UserOut)
async def demo_create_user(data: DemoUserIn, db: DbSession):
    user = await repository.get_user_full(db, data.user_id)
    if user:
        return user

    houses = await repository.get_random_houses(db, 2)
    if not houses:
        raise HTTPException(500, "No houses in DB - засейте houses")

    return await repository.create_user(
        db, data.user_id, data.name, data.chat_id, houses
    )


# создает обращение
@router.post("/appeals/create", response_model=AppealDetailedOut)
async def create_appeal(
    data: AppealIn,
    db: DbSession,
    agent: AppealAgentDep,
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
    print(classification)
    if classification.problem_type == 'другая':
        bot_text = ("Данное сообщение не явялется обращением.")
        raise HTTPException(403, "Appeal is bad")
    else:
        bot_text = (
            f"Тип: {classification.problem_type}\n"
            f"Ответственный: {classification.responsible_org}\n"
            f"{classification.deadline_text}\n"
            f"План: {classification.action_plan}"
        )
    mail_subject = f"🏠 Новое обращение от {user.name} с адресса {data.address} на тему {classification.problem_type} от {datetime.now()}"
    await asyncio.to_thread(
        mail.send,
        to="akuninsemen79@gmail.com",
        subject=mail_subject,
        text=f"Новое обращение \n\n{data.text}\n\n{bot_text}",
        html=html_templates.new_appeal_html(
            user_name=user.name,
            address=data.address,
            text=data.text,
            classification_problem_type=classification.problem_type,
            classification_org=classification.responsible_org,
            deadline_text=classification.deadline_text,
            action_plan=classification.action_plan,
            attachments=[{"data": b64, "filename": f"photo_{i}.jpg", "mime": "image/jpeg"} for i, b64 in enumerate(data.attachments or [])],
        ),
        attachments=[{"data": b64, "filename": f"photo_{i}.jpg", "mime": "image/jpeg"} for i, b64 in enumerate(data.attachments or [])],
    )

    return await repository.create_appeal(
        db, user.id, data.address, data.text, data.attachments, classification, bot_text, mail_subject
    )


# обновить статус обращения
@router.patch("/appeals/{appeal_id}/update", response_model=AppealOut)
async def update_appeal_status(
    appeal_id: int,
    data: StatusIn,
    db: DbSession,
    settings: SettingsDep,
):
    appeal = await repository.get_appeal(db, appeal_id)
    if not appeal:
        raise HTTPException(404, "Not found")
    old_status = appeal.status
    changed = old_status != data.status
    await repository.set_appeal_status(
        db,
        appeal,
        data.status,
        f"Статус изменён: {old_status} → {data.status}" if changed else None,
    )
    # уведа в чат
    if changed:
        try:
            user = await repository.get_user(db, appeal.author_id)
            chat_id = user.max_chat_id
            await asyncio.to_thread(
                requests.post,
                f"{settings.max_api_url}/messages",
                params={"chat_id": chat_id},
                headers={"Authorization": settings.max_token},
                json={
                    "text": f"Статус обращения №{appeal.id} изменён на {data.status}"
                },
                timeout=5,
            )
        except Exception:  # noqa: BLE001 — уведомление не должно ронять запрос
            logger.exception("не получилось уведомить в бота")

    return appeal


# получаем все обращения с дома.
@router.get("/appeals", response_model=list[AppealOut])
async def list_address_appeals(address: str, db: DbSession):
    return await repository.list_appeals_by_address(db, address)


# получаем обращение по id
@router.get("/appeals/{appeal_id}", response_model=AppealDetailedOut)
async def get_appeal(appeal_id: int, db: DbSession):
    appeal = await repository.get_appeal_detailed(db, appeal_id)
    if not appeal:
        raise HTTPException(404, "Not found")
    return appeal


# отправляем сообщение в обращение.
@router.post("/appeals/{appeal_id}/message", response_model=MessageOut)
async def send_message_appeal(
    appeal_id: int,
    data: MessageIn,
    db: DbSession,
    agent: AppealAgentDep,
):
    appeal = await repository.get_appeal_detailed(db, appeal_id)

    if not appeal:
        raise HTTPException(404, "Обращение не найдено")

    user = await repository.get_user(db, data.user_id)

    if not user:
        raise HTTPException(404, "Пользователь не найден")

    sender = user.name

    classification = (await agent.run(data.text)).output

    if classification.problem_type == "другая":
        return await repository.add_appeal_message(
            db,
            appeal.id,
            sender,
            data.text,
            data.attachments,
            bot_text="Это не является дополнением к обращению.",
        )

    print(classification.problem_type)

    await asyncio.to_thread(
        mail.send,
        to="akuninsemen79@gmail.com",
        subject=appeal.mail_subject,
        text=data.text,
        html=html_templates.addition_html(
            appeal_id=appeal.id,
            sender=sender,
            text=data.text,
        ),
        attachments=[
            {
                "data": b64,
                "filename": f"photo_{i}.jpg",
                "mime": "image/jpeg",
            }
            for i, b64 in enumerate(data.attachments)
        ],
    )

    return await repository.add_appeal_message(
        db,
        appeal.id,
        sender,
        data.text,
        data.attachments,
        bot_text="Мы приняли дополнительные данные и передали их уполномоченной компании.",
    )
    

# получаем все дома юзера
@router.get("/users/{user_id}/houses", response_model=list[HouseOut])
async def list_user_houses(user_id: int, db: DbSession):
    user = await repository.get_user_with_houses(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user.houses


# информация о юзере
@router.get("/users/{user_id}", response_model=UserOut)
async def get_user_info(user_id: int, db: DbSession):
    user = await repository.get_user_full(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user


# получаем все обращения пользователя с сообщениями
@router.get("/users/{user_id}/appeals", response_model=list[AppealDetailedOut])
async def list_user_appeals(user_id: int, db: DbSession):
    return await repository.list_user_appeals(db, user_id, with_messages=True)


# получаем все обращения пользователя кратко
@router.get("/users/{user_id}/appeals/short", response_model=list[AppealOut])
async def list_user_appeals_short(user_id: int, db: DbSession):
    return await repository.list_user_appeals(db, user_id)


# добавить дом
@router.post("/houses", response_model=HouseOut)
async def add_house(data: AddressIn, db: DbSession):
    if await repository.get_house_by_address(db, data.address):
        raise HTTPException(400, "House already exists")
    return await repository.create_house(db, data.address)


# посмотреть все дома
@router.get("/houses", response_model=list[HouseOut])
async def list_houses(db: DbSession):
    return await repository.list_houses(db)


# получаем информацию о доме с сообщениями
@router.get("/houses/{house_id}", response_model=HouseDetailOut)
async def get_house_info(house_id: int, db: DbSession):
    house = await repository.get_house_detailed(db, house_id)
    if not house:
        raise HTTPException(404, "Not found")
    return house


# отправка сообщений в дом
@router.post("/houses/{house_id}/message", response_model=MessageOut)
async def send_message(house_id: int, data: MessageIn, db: DbSession):
    house = await repository.get_house(db, house_id)
    user = await repository.get_user(db, data.user_id)
    if not user:
        raise HTTPException(404, "Not found")
    sender = user.name
    if not house:
        raise HTTPException(404, "Not found")
    return await repository.add_house_message(
        db, house.id, sender, data.text, data.attachments
    )
