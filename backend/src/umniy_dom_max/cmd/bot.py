import json
import sys
from datetime import UTC, datetime

import requests
import urllib3
from loguru import logger

from umniy_dom_max.llm import create_appeal_agent
from umniy_dom_max.settings import Settings

main_attachment = [{
    "type": "inline_keyboard",
    "payload": {"buttons": [
        [{"type": "callback", "text": "Написать обращение", "payload": "write_appeal"}],
        [{"type": "callback", "text": "Мои обращения", "payload": "my_appeals"}]
    ]}
}]

reject_attachment = [{
    "type": "inline_keyboard",
    "payload": {"buttons": [[{"type": "callback", "text": "Отмена", "payload": "reject"}]]}
}]


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

    session = requests.Session()
    session.verify = False
    session.headers.update({"Authorization": settings.max_token})

    print(json.dumps(session.get(f"{api}/me").json(), ensure_ascii=False, indent=2))

    agent = create_appeal_agent(settings)

    def send_msg(chat_id, text, attachment=None):
        body = {"text": text}
        if attachment:
            body["attachments"] = attachment
        r = session.post(f"{api}/messages", params={"chat_id": chat_id}, json=body)
        logger.info("{} {}", r.status_code, r.text)
        return r

    waiting = set()

    marker = None
    while True:
        resp = session.get(f"{api}/updates", params={"marker": marker}, timeout=35).json()
        if "code" in resp:
            print(json.dumps(resp, ensure_ascii=False, indent=2))
            break
        marker = resp.get("marker")
        for update in resp.get("updates", []):
            chat_id = update.get("chat_id") or (update.get("message") or {}).get("recipient", {}).get("chat_id")
            if not chat_id and update.get("update_type") == "message_callback":
                chat_id = (update.get("message") or {}).get("recipient", {}).get("chat_id")

            update_type = update.get("update_type")

            if update_type == "bot_started":
                send_msg(chat_id, "Выберите действие:", attachment=main_attachment)

            elif update_type == "message_created":
                if  chat_id in waiting:
                    appeal = update.get("message").get("body").get("text")
                    data = agent.run_sync(appeal).output.model_dump()
                    name = update.get("message").get("sender").get("first_name")
                    formed = {
                        "date": datetime.now(UTC).isoformat(),
                        "author_name": name,
                        "chat_id": chat_id,
                        "appeal_text": appeal,
                        **data
                    }
                    print(json.dumps(formed, ensure_ascii=False, indent=2))
                    pretty = (
                        f"Вот ваш запрос сформирован:\n\n"
                        f"Дата: {formed['date']}\n"
                        f"Автор: {formed['author_name']}\n"
                        f"Обращение: {formed['appeal_text']}\n\n"
                        f"Тип проблемы: {formed.get('problem_type','-')}\n"
                        f"Срочность: {formed.get('urgency','-')}\n"
                        f"Ответственный: {formed.get('responsible_org','-')}\n"
                        f"{formed.get('deadline_text','')}\n"
                        f"План: {formed.get('action_plan','-')}"
                    )
                    send_msg(chat_id, pretty)
                    waiting.discard(chat_id)
                    send_msg(chat_id, "спасибо за обращение")
                send_msg(chat_id, "Выберите действие:", attachment=main_attachment)

            elif update_type == "message_callback":
            
                payload = (update.get("callback") or {}).get("payload")
                if payload == "write_appeal":
                    waiting.add(chat_id)
                    send_msg(chat_id, "Напишите текст обращения одним сообщением:", attachment=reject_attachment)

                elif payload == "reject":
                    waiting.discard(chat_id)
                    send_msg(chat_id, "Выберите действие:", attachment=main_attachment)

                elif payload == "my_appeals":
                    send_msg(chat_id, "Тут будут ваши обращения", attachment=main_attachment)


if __name__ == "__main__":
    main()
