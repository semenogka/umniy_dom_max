import asyncio
import json
import sys
from html import escape

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

START_TEXT = (
    "<b>Домовой</b> — помощник жителя по всем вопросам дома.\n\n"
    "Опишите проблему своими словами: протечка, не работает лифт, мусор во дворе. "
    "Домовой сам определит, кто отвечает, отправит обращение в управляющую компанию "
    "и сообщит здесь, когда статус изменится.\n\n"
    "Ещё в приложении есть общий чат жителей вашего дома.\n\n"
    "Откройте мини-приложение и войдите через Госуслуги, чтобы начать."
)


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

    async def user_appeals(user_id):
        async with sessionmaker() as db:
            return await repository.list_user_appeals(db, user_id)

    session = requests.Session()
    session.verify = False
    session.headers.update({"Authorization": settings.max_token})

    me = session.get(f"{api}/me").json()
    logger.info("MAX /me: {}", json.dumps(me, ensure_ascii=False))

    # Регистрация только в мини-приложении (экран ЕСИА), бот лишь зовёт туда
    start_attachment = [
        {
            "type": "inline_keyboard",
            "payload": {
                "buttons": [
                    [{
                        "type": "open_app",
                        "text": "Открыть Домового",
                        "web_app": me["username"],
                        "contact_id": me["user_id"],
                    }],
                    *main_attachment[0]["payload"]["buttons"],
                ]
            },
        }
    ]

    def send_msg(chat_id, text, attachment=None):
        body = {"text": text, "format": "html"}
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
                chat_id = chat_id or update.get("chat_id") or (update.get("user") or {}).get("chat_id")
                if not chat_id:
                    logger.warning(f"bot_started: нет chat_id — {update}")
                    continue
                send_msg(chat_id, START_TEXT, attachment=start_attachment)

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

                    lines = ["<b>Ваши обращения</b>", ""]
                    for a in appeals:
                        if a.status != "close":
                            name = a.title or a.problem_type
                            lines.append(f"<b>№{a.id}</b>" + (f" · {escape(name)}" if name else ""))
                            lines.append(f"Статус: <b>{STATUS_LABELS.get(a.status, a.status)}</b>")
                            if a.appeal_address:
                                lines.append(f"Адрес: {escape(a.appeal_address)}")
                            lines.append("")

                    send_msg(chat_id, "\n".join(lines), attachment=main_attachment)


if __name__ == "__main__":
    main()
