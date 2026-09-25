import json
import sys

import requests
import urllib3
from loguru import logger

from umniy_dom_max.schemas import DemoUserIn
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

    session = requests.Session()
    session.verify = False
    session.headers.update({"Authorization": settings.max_token})

    print(json.dumps(session.get(f"{api}/me").json(), ensure_ascii=False, indent=2))

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
            print(json.dumps(resp, ensure_ascii=False, indent=2))
            break
        marker = resp.get("marker")
        for update in resp.get("updates", []):
            chat_id = (update.get("message") or {}).get("recipient", {}).get("chat_id")
            update_type = update.get("update_type")

            if update_type == "bot_started":
                user_id = (update.get("user") or {}).get("user_id")
                name = update.get("user").get("first_name")

                data = DemoUserIn(user_id=user_id, chat_id=chat_id, name=name)
                requests.post(
                    "https://domovoy.stirkk.ru/users/demo", json=data.model_dump()
                )
                send_msg(
                    chat_id,
                    "Вы успешно зарегестрировались в Домовой! Перейдите в мини приложение, чтобы",
                    attachment=main_attachment,
                )

            elif update_type == "message_callback":
                payload = (update.get("callback") or {}).get("payload")
                if payload == "my_appeals":
                    send_msg(
                        chat_id, "Тут будут ваши обращения", attachment=main_attachment
                    )


if __name__ == "__main__":
    main()
