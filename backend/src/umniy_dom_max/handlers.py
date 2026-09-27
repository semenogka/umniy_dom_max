import asyncio
import json

import fastapi
import requests
from fastapi import HTTPException, WebSocket, WebSocketDisconnect
from loguru import logger
from datetime import datetime
from umniy_dom_max.mail import Mail
from umniy_dom_max.db import repository
from umniy_dom_max.settings import Settings
from umniy_dom_max.dependencies import AppealAgentDep, DbSession, SettingsDep, WsManagerDep
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
from umniy_dom_max.ws import appeal_room, house_room
router = fastapi.APIRouter()
settings = Settings()
mail = Mail(settings.mail_host, settings.mail_user, settings.mail_password)

status = {
    "in_progress": "В работе",
    "dop": "Дополните",
    "checked": "Проверено",
    "close": "Закрыто"
}

@router.post("/users/demo", response_model=UserOut, tags=["Пользователи"],
             summary="Создать демо-пользователя",
             description="Создаёт демо-пользователя со случайными домами, если он ещё не существует. Возвращает данные пользователя.")
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


@router.post("/appeals/create", response_model=AppealDetailedOut, tags=["Обращения"],
             summary="Создать обращение",
             description="Создаёт новое обращение жителя. Классифицирует текст через LLM, отправляет уведомление на email. "
                         "Возвращает детальную информацию об обращении.")
async def create_appeal(
    data: AppealIn,
    db: DbSession,
    agent: AppealAgentDep,
    ws: WsManagerDep,
):
    try:
        classification = (await agent.run(data.text)).output
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}") from e

    user = await repository.get_user_with_houses(db, data.user_id)
    if not user:
        raise HTTPException(404, "Not found user")
    house = await repository.get_house(db, data.house_id)
    if not house:
        raise HTTPException(404, "Not found house")
    if not any(h.address == house.address for h in user.houses):
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
    mail_subject = f"🏠 Новое обращение от {user.name} с адресса {house.address} на тему {classification.problem_type} от {datetime.now()}"
    await asyncio.to_thread(
        mail.send,
        to="akuninsemen79@gmail.com",
        subject=mail_subject,
        text=f"Новое обращение \n\n{data.text}\n\n{bot_text}",
        html=html_templates.new_appeal_html(
            user_name=user.name,
            address=house.address,
            text=data.text,
            classification_problem_type=classification.problem_type,
            classification_org=classification.responsible_org,
            deadline_text=classification.deadline_text,
            action_plan=classification.action_plan,
            attachments=[{"data": b64, "filename": f"photo_{i}.jpg", "mime": "image/jpeg"} for i, b64 in enumerate(data.attachments or [])],
        ),
        attachments=[{"data": b64, "filename": f"photo_{i}.jpg", "mime": "image/jpeg"} for i, b64 in enumerate(data.attachments or [])],
    )

    appeal = await repository.create_appeal(
        db, user.id, house.address, data.text, data.attachments, classification, bot_text, mail_subject, user.name
    )
    await ws.broadcast(
        house_room(house.id),
        {
            "type": "appeal_created",
            "data": AppealOut.model_validate(appeal).model_dump(mode="json"),
        },
    )
    return appeal


@router.patch("/appeals/{appeal_id}/update", response_model=AppealOut, tags=["Обращения"],
             summary="Обновить статус обращения",
             description="Изменяет статус обращения. При изменении статуса отправляет уведомление в чат MAX и на email.")
async def update_appeal_status(
    appeal_id: int,
    data: StatusIn,
    db: DbSession,
    settings: SettingsDep,
    ws: WsManagerDep,
):
    appeal = await repository.get_appeal(db, appeal_id)
    if not appeal:
        raise HTTPException(404, "Not found")
    old_status = appeal.status
    changed = old_status != data.status
    msg = f"Статус по {appeal_id} изменён: {status[old_status]} → {status[data.status]}."
    if data.status != "close":
        msg += f"Посмотрите ответ по вашему обращению: {data.mail_text}"

    if data.status == "dop":
        bot_text = "Статус изменен. Запрашивают дополнительные данные для обращения."
    if data.status == "checked":
        bot_text = "Статус изменен. Ваш запрос проверен."

    system_msg = await repository.set_appeal_status(
        db,
        appeal,
        data.status,
        msg if changed else None,
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
                    "text": f"Статус обращения №{appeal.id} изменён на {status[data.status]}. {data.mail_text}"
                },
                timeout=5,
                verify=False,
            )
        except Exception:  # noqa: BLE001 — уведомление не должно ронять запрос
            logger.exception("не получилось уведомить в бота")

        appeal_payload = {
            "type": "appeal_updated",
            "data": AppealOut.model_validate(appeal).model_dump(mode="json"),
        }
        await ws.broadcast(appeal_room(appeal.id), appeal_payload)

        if appeal.appeal_address:
            house = await repository.get_house_by_address(db, appeal.appeal_address)
            if house:
                await ws.broadcast(house_room(house.id), appeal_payload)

        if system_msg is not None:
            await ws.broadcast(
                appeal_room(appeal.id),
                {
                    "type": "message",
                    "data": MessageOut(
                        id=system_msg.id,
                        sender_id=system_msg.sender_id,
                        sender=system_msg.sender or "bot",
                        text=system_msg.text,
                        created_at=system_msg.created_at,
                        is_read=bool(system_msg.is_read),
                        attachments=[],
                    ).model_dump(mode="json"),
                },
            )

    return appeal


@router.get("/appeals/{appeal_id}/messages", response_model=AppealDetailedOut, tags=["Обращения"],
             summary="Получить обращение по ID",
             description="Возвращает детальную информацию об обращении по его ID, включая сообщения.")
async def get_appeal(appeal_id: int, db: DbSession):
    appeal = await repository.get_appeal_detailed(db, appeal_id)
    if not appeal:
        raise HTTPException(404, "Not found")
    return appeal


@router.get("/houses/{house_id}/appeals", response_model=list[AppealOut], tags=["Обращения"],
             summary="Список обращений по дому",
             description="Возвращает список всех обращений, связанных с указанным домом.")
async def list_appeals_by_house_id(house_id: int, db: DbSession):
    house = await repository.get_house(db, house_id)
    if not house:
        raise HTTPException(404, "House not found")
    return await repository.list_appeals_by_house_id(db, house_id)


@router.post("/appeals/{appeal_id}/message", response_model=MessageOut, tags=["Обращения"],
             summary="Отправить сообщение в обращение",
             description="Отправляет дополнительное сообщение в существующее обращение."
                         "Текст проходит классификацию через LLM, результат отправляется на email.")
async def send_message_appeal(
    appeal_id: int,
    data: MessageIn,
    db: DbSession,
    agent: AppealAgentDep,
    ws: WsManagerDep,
):
    appeal = await repository.get_appeal_detailed(db, appeal_id)

    if not appeal:
        raise HTTPException(404, "Обращение не найдено")

    user = await repository.get_user(db, data.user_id)
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    sender = user.name

    if appeal.status == "close":
        message = await repository.add_appeal_message(
            db,
            appeal.id,
            data.user_id,
            sender,
            data.text,
            data.attachments,
            bot_text="Данное обращение уже закрыто.",
        )
        await ws.broadcast(
            appeal_room(appeal.id),
            {"type": "message", "data": MessageOut.model_validate(message).model_dump(mode="json")},
        )
        return message

    classification = (await agent.run(data.text)).output

    if classification.problem_type == "другая":
        message = await repository.add_appeal_message(
            db,
            appeal.id,
            data.user_id,
            sender,
            data.text,
            data.attachments,
            bot_text="Это не является дополнением к обращению.",
        )
        await ws.broadcast(
            appeal_room(appeal.id),
            {"type": "message", "data": MessageOut.model_validate(message).model_dump(mode="json")},
        )
        return message

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

    message = await repository.add_appeal_message(
        db,
        appeal.id,
        data.user_id,
        sender,
        data.text,
        data.attachments,
        bot_text="Мы приняли дополнительные данные и передали их уполномоченной компании.",
    )
    await ws.broadcast(
        appeal_room(appeal.id),
        {"type": "message", "data": MessageOut.model_validate(message).model_dump(mode="json")},
    )
    return message

@router.get("/users/{user_id}/houses", response_model=list[HouseOut], tags=["Пользователи"],
             summary="Список домов пользователя",
             description="Возвращает список домов, привязанных к указанному пользователю.")
async def list_user_houses(user_id: int, db: DbSession):
    user = await repository.get_user_with_houses(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user.houses


@router.get("/users/{user_id}", response_model=UserOut, tags=["Пользователи"],
             summary="Информация о пользователе",
             description="Возвращает полную информацию о пользователе, включая привязанные дома и историю обращений.")
async def get_user_info(user_id: int, db: DbSession):
    user = await repository.get_user_full(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user


@router.get("/users/{user_id}/appeals", response_model=list[AppealDetailedOut], tags=["Пользователи"],
             summary="Все обращения пользователя (детально)",
             description="Возвращает список всех обращений пользователя с детальной информацией, включая сообщения.")
async def list_user_appeals(user_id: int, db: DbSession):
    return await repository.list_user_appeals(db, user_id, with_messages=True)


@router.get("/users/{user_id}/appeals/short", response_model=list[AppealOut], tags=["Пользователи"],
             summary="Все обращения пользователя (кратко)",
             description="Возвращает краткий список обращений пользователя без детальной информации о сообщениях.")
async def list_user_appeals_short(user_id: int, db: DbSession):
    return await repository.list_user_appeals(db, user_id)


@router.post("/houses", response_model=HouseOut, tags=["Дома"],
             summary="Добавить дом",
             description="Добавляет новый дом в базу данных. Возвращает 400, если дом с таким адресом уже существует.")
async def add_house(data: AddressIn, db: DbSession):
    if await repository.get_house_by_address(db, data.address):
        raise HTTPException(400, "House already exists")
    return await repository.create_house(db, data.address)


@router.get("/houses", response_model=list[HouseOut], tags=["Дома"],
             summary="Список всех домов",
             description="Возвращает список всех домов в базе данных.")
async def list_houses(db: DbSession):
    return await repository.list_houses(db)


@router.get("/houses/{house_id}/messages", response_model=HouseDetailOut, tags=["Дома"],
             summary="Информация о доме с сообщениями",
             description="Возвращает детальную информацию о доме, включая историю сообщений общего чата.")
async def get_house_info(house_id: int, db: DbSession):
    house = await repository.get_house_detailed(db, house_id)
    if not house:
        raise HTTPException(404, "Not found")
    return house


@router.post("/houses/{house_id}/message", response_model=MessageOut, tags=["Дома"],
             summary="Отправить сообщение в общий чат дома",
             description="Отправляет сообщение пользователя в общий чат дома (не связано с конкретным обращением).")
async def send_message(house_id: int, data: MessageIn, db: DbSession, ws: WsManagerDep):
    house = await repository.get_house(db, house_id)
    user = await repository.get_user(db, data.user_id)
    if not user:
        raise HTTPException(404, "Not found")
    sender = user.name
    if not house:
        raise HTTPException(404, "Not found")
    message = await repository.add_house_message(
        db, house.id, data.user_id, sender, data.text, data.attachments
    )
    await ws.broadcast(
        house_room(house.id),
        {"type": "message", "data": MessageOut.model_validate(message).model_dump(mode="json")},
    )
    return message


async def _chat_ws(
    websocket: WebSocket,
    room: str,
    user_id: int,
    mark_read,
):
    manager = websocket.app.state.ws_manager
    await manager.connect(room, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if payload.get("type") != "read":
                continue

            message_ids = payload.get("message_ids")
            if not isinstance(message_ids, list):
                continue

            ids = [int(item) for item in message_ids if isinstance(item, int) or str(item).isdigit()]
            if not ids:
                continue

            async with websocket.app.state.sessionmaker() as db:
                updated = await mark_read(db, user_id, ids)

            if updated:
                await manager.broadcast(room, {"type": "read", "message_ids": updated})
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room, websocket)


@router.websocket("/ws/houses/{house_id}")
async def house_chat_ws(
    websocket: WebSocket,
    house_id: int,
    user_id: int,
):
    await _chat_ws(
        websocket,
        house_room(house_id),
        user_id,
        lambda db, reader_id, ids: repository.mark_house_messages_read(
            db, house_id, reader_id, ids
        ),
    )


@router.websocket("/ws/appeals/{appeal_id}")
async def appeal_chat_ws(
    websocket: WebSocket,
    appeal_id: int,
    user_id: int,
):
    await _chat_ws(
        websocket,
        appeal_room(appeal_id),
        user_id,
        lambda db, reader_id, ids: repository.mark_appeal_messages_read(
            db, appeal_id, reader_id, ids
        ),
    )
