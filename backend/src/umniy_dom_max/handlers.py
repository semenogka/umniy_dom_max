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
users_router = fastapi.APIRouter(prefix="/users", tags=["Пользователи"])
appeals_router = fastapi.APIRouter(prefix="/appeals", tags=["Обращения"])
houses_router = fastapi.APIRouter(prefix="/houses", tags=["Дома"])

router = fastapi.APIRouter()
router.include_router(users_router)
router.include_router(appeals_router)
router.include_router(houses_router)

settings = Settings()
mail = Mail(settings.mail_host, settings.mail_user, settings.mail_password)

# мок авторизации юзера
@users_router.post(
    "/demo",
    response_model=UserOut,
    summary="Создать демо-пользователя",
    description=(
        "Ищет пользователя по `user_id`. Если он уже существует — просто возвращает его. "
        "Если пользователя нет — создаёт нового и привязывает к нему 2 случайных дома из базы "
        "(упрощённая мок-авторизация для демо, без реального логина)."
    ),
)
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
@appeals_router.post(
    "/create",
    response_model=AppealDetailedOut,
    summary="Создать обращение",
    description=(
        "Принимает текст обращения (и фото-вложения) от жителя и передаёт его LLM-агенту для классификации "
        "(тип проблемы, ответственная организация, срок реагирования, план действий). "
        "Проверяет, что адрес привязан к пользователю (403, если нет), и что пользователь существует (404, если нет). "
        "Если LLM определяет текст как не относящийся к обращениям (`problem_type == 'другая'`) — возвращает 403. "
        "В остальных случаях отправляет письмо с обращением на почту УК и сохраняет обращение в базе."
    ),
)
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
@appeals_router.patch(
    "/{appeal_id}/update",
    response_model=AppealOut,
    summary="Обновить статус обращения",
    description=(
        "Меняет статус обращения по его `appeal_id` (например, «в работе» → «решено»). "
        "404, если обращение не найдено. Если статус реально изменился — в историю обращения добавляется запись "
        "об изменении и пользователю отправляется уведомление в чат MAX (ошибка отправки уведомления "
        "не влияет на успешный ответ запроса)."
    ),
)
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
@appeals_router.get(
    "",
    response_model=list[AppealOut],
    summary="Обращения по адресу дома",
    description="Возвращает список всех обращений, созданных по указанному адресу дома, без переписки по ним.",
)
async def list_address_appeals(address: str, db: DbSession):
    return await repository.list_appeals_by_address(db, address)


# получаем обращение по id
@appeals_router.get(
    "/{appeal_id}",
    response_model=AppealDetailedOut,
    summary="Обращение по id",
    description="Возвращает подробную информацию об обращении вместе со всей перепиской (сообщениями) по нему. 404, если не найдено.",
)
async def get_appeal(appeal_id: int, db: DbSession):
    appeal = await repository.get_appeal_detailed(db, appeal_id)
    if not appeal:
        raise HTTPException(404, "Not found")
    return appeal


# отправляем сообщение в обращение.
@appeals_router.post(
    "/{appeal_id}/message",
    response_model=MessageOut,
    summary="Добавить сообщение к обращению",
    description=(
        "Добавляет сообщение (дополнение) к уже существующему обращению. 404, если обращение не найдено. "
        "Текст сообщения также прогоняется через LLM-классификатор: если он релевантен обращению — "
        "пересылается на почту УК как дополнение, а если тип «другая» — сохраняется с пометкой, "
        "что дополнением не является."
    ),
)
async def send_message_appeal(appeal_id: int, data: MessageIn, db: DbSession, agent: AppealAgentDep,):
    appeal = await repository.get_appeal_detailed(db, appeal_id)
    if not appeal:
        raise HTTPException(404) 
    classification = (await agent.run(data.text)).output
    if classification.problem_type == 'другая':
        return await repository.add_appeal_message(
            db, appeal.id, data.sender, data.text, data.attachments, bot_text="Это не является дополнением к обращению."
        )
    else:
        print(classification.problem_type)
        await asyncio.to_thread(
            mail.send,
            to="akuninsemen79@gmail.com",
            subject=appeal.mail_subject,
            text=data.text,
            html=html_templates.addition_html(
                appeal_id=appeal.id,
                sender=data.sender,
                text=data.text,
            ),
            attachments=[{"data": b64, "filename": f"photo_{i}.jpg", "mime": "image/jpeg"} for i, b64 in enumerate(data.attachments or [])],
        )
        print(classification)
        return await repository.add_appeal_message(
            db, appeal.id, data.sender, data.text, data.attachments, bot_text="Мы приняли дополнительные данные и передали их уполномоченной компании."
        )
    

# получаем все дома юзера
@users_router.get(
    "/{user_id}/houses",
    response_model=list[HouseOut],
    summary="Дома пользователя",
    description="Возвращает список домов, привязанных к пользователю. 404, если пользователь не найден.",
)
async def list_user_houses(user_id: int, db: DbSession):
    user = await repository.get_user_with_houses(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user.houses


# информация о юзере
@users_router.get(
    "/{user_id}",
    response_model=UserOut,
    summary="Информация о пользователе",
    description="Возвращает профиль пользователя вместе со списком привязанных к нему домов. 404, если не найден.",
)
async def get_user_info(user_id: int, db: DbSession):
    user = await repository.get_user_full(db, user_id)
    if not user:
        raise HTTPException(404, "Not found")
    return user


# получаем все обращения пользователя с сообщениями
@users_router.get(
    "/{user_id}/appeals",
    response_model=list[AppealDetailedOut],
    summary="Обращения пользователя (подробно)",
    description="Возвращает все обращения пользователя вместе с перепиской (сообщениями) по каждому из них.",
)
async def list_user_appeals(user_id: int, db: DbSession):
    return await repository.list_user_appeals(db, user_id, with_messages=True)


# получаем все обращения пользователя кратко
@users_router.get(
    "/{user_id}/appeals/short",
    response_model=list[AppealOut],
    summary="Обращения пользователя (кратко)",
    description="Возвращает обращения пользователя без переписки — лёгкий вариант для списков и превью в интерфейсе.",
)
async def list_user_appeals_short(user_id: int, db: DbSession):
    return await repository.list_user_appeals(db, user_id)


# добавить дом
@houses_router.post(
    "",
    response_model=HouseOut,
    summary="Добавить дом",
    description="Создаёт новый дом по адресу. Возвращает 400, если дом с таким адресом уже существует.",
)
async def add_house(data: AddressIn, db: DbSession):
    if await repository.get_house_by_address(db, data.address):
        raise HTTPException(400, "House already exists")
    return await repository.create_house(db, data.address)


# посмотреть все дома
@houses_router.get(
    "",
    response_model=list[HouseOut],
    summary="Список домов",
    description="Возвращает список всех домов, зарегистрированных в системе.",
)
async def list_houses(db: DbSession):
    return await repository.list_houses(db)


# получаем информацию о доме с сообщениями
@houses_router.get(
    "/{house_id}",
    response_model=HouseDetailOut,
    summary="Информация о доме",
    description="Возвращает данные дома вместе с сообщениями его общего чата (не привязанными к конкретному обращению). 404, если дом не найден.",
)
async def get_house_info(house_id: int, db: DbSession):
    house = await repository.get_house_detailed(db, house_id)
    if not house:
        raise HTTPException(404, "Not found")
    return house


# отправка сообщений в дом
@houses_router.post(
    "/{house_id}/message",
    response_model=MessageOut,
    summary="Отправить сообщение в чат дома",
    description="Добавляет сообщение в общий чат дома, не связанное с конкретным обращением. 404, если дом не найден.",
)
async def send_message(house_id: int, data: MessageIn, db: DbSession):
    house = await repository.get_house(db, house_id)
    if not house:
        raise HTTPException(404, "Not found")
    return await repository.add_house_message(
        db, house.id, data.sender, data.text, data.attachments
    )
