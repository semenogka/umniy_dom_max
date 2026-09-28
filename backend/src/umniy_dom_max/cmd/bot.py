import asyncio
import json
import sys

import requests
import urllib3
from loguru import logger

from umniy_dom_max.db import repository
from umniy_dom_max.db.database import create_engine, create_sessionmaker
from umniy_dom_max.schemas import STATUS_LABELS
from umniy_dom_max.settings import Settings

main_attachment = [
    {
        "type": "inline_keyboard",
        "payload": {
            "buttons": [
                [{"type": "callback", "text": "Мои обращения", "payload": "my_appeals"}]
            ]
        },
    }
]


def main():
    if sys.stdout.encoding != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
    if sys.stderr.encoding != "utf-8":
        sys.stderr.reconfigure(encoding="utf-8")

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    settings = Settings()
    if not settings.gpt_token:
        raise RuntimeError("GPT_TOKEN не задан")
    if not settings.max_token:
        raise RuntimeError("MAX_TOKEN не задан")

    api = settings.max_api_url

    # Бот синхронный, а репозиторий async — гоняем запросы к БД в одном event loop
    runner = asyncio.Runner()
    sessionmaker = create_sessionmaker(create_engine(settings.database_url))

    async def register_user(user_id, name, chat_id):
        async with sessionmaker() as db:
            if await repository.get_user(db, user_id):
                return
            houses = await repository.get_random_houses(db, 2)
            if not houses:
                raise RuntimeError("В БД нет домов — засейте houses")
            await repository.create_user(db, user_id, name, chat_id, houses)

    async def user_appeals(user_id):
        async with sessionmaker() as db:
            return await repository.list_user_appeals(db, user_id)

    session = requests.Session()
    session.verify = False
    session.headers.update({"Authorization": settings.max_token})

    logger.info("MAX /me: {}", json.dumps(session.get(f"{api}/me").json(), ensure_ascii=False))

    def send_msg(chat_id, text, attachment=None):
        body = {"text": text}
        if attachment:
            body["attachments"] = attachment
        r = session.post(f"{api}/messages", params={"chat_id": chat_id}, json=body)
        logger.info("{} {}", r.status_code, r.text)
        return r

    marker = None
    while True:
        resp = session.get(
            f"{api}/updates", params={"marker": marker}, timeout=35
        ).json()
        if "code" in resp:
            logger.error("MAX /updates: {}", json.dumps(resp, ensure_ascii=False))
            break
        marker = resp.get("marker")
        for update in resp.get("updates", []):
            chat_id = (update.get("message") or {}).get("recipient", {}).get("chat_id")
            update_type = update.get("update_type")

            if update_type == "bot_started":
                user = update.get("user") or {}
                user_id = user.get("user_id")
                name = user.get("first_name")
                chat_id = (
                    chat_id
                    or update.get("chat_id")
                    or user.get("chat_id")
                )

                if not chat_id or not user_id or not name:
                    logger.warning(f"bot_started: не хватает данных — {update}")
                    continue

                try:
                    runner.run(register_user(user_id, name, chat_id))
                except Exception as e:
                    logger.error(f"Ошибка регистрации пользователя {user_id}: {e}")
                    send_msg(chat_id, "Не удалось зарегистрироваться, попробуйте позже.")
                    continue
                send_msg(
                    chat_id,
                    "Вы успешно зарегистрировались в Домовом! Перейдите в мини-приложение, чтобы оставить обращение.",
                    attachment=main_attachment,
                )

            elif update_type == "message_callback":
                callback = update.get("callback") or {}
                payload = callback.get("payload")
                if payload == "my_appeals":
                    user_id = (callback.get("user") or {}).get("user_id")
                    if not user_id:
                        logger.warning(f"my_appeals: нет user_id — {update}")
                        continue

                    try:
                        appeals = runner.run(user_appeals(user_id))
                    except Exception as e:
                        logger.error(f"Ошибка получения обращений: {e}")
                        send_msg(chat_id, "Не удалось загрузить обращения.")
                        continue

                    if not appeals:
                        send_msg(chat_id, "У вас пока нет обращений.")
                        continue

                    lines = ["Ваши обращения:", ""]
                    for a in appeals:
                        if a.status != "close":
                            lines.append(f"№{a.id} — {STATUS_LABELS.get(a.status, a.status)}")
                            if a.problem_type:
                                lines.append(f"  Тип: {a.problem_type}")
                            if a.appeal_address:
                                lines.append(f"  Адрес: {a.appeal_address}")
                            lines.append("")

                    send_msg(chat_id, "\n".join(lines), attachment=main_attachment)


if __name__ == "__main__":
    main()
