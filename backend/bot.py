import os
import sys
import json
import requests
import urllib3
import asyncio
from dotenv import load_dotenv
from gpt_client import GPTClient
from datetime import datetime, timezone
from loguru import logger
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()


GPT_TOKEN = os.getenv("GPT_TOKEN")
if not GPT_TOKEN:
    raise RuntimeError("GPT_TOKEN не найден в backend/.env")

TOKEN = os.getenv("MAX_TOKEN")
if not TOKEN:
    raise RuntimeError("MAX_TOKEN не найден в backend/.env")

API = "https://platform-api2.max.ru"

SYSTEM_PROMPT = """Ты — классификатор обращений жителей.

Задача: по тексту обращения определи и верни ТОЛЬКО валидный JSON без markdown и пояснений.

Житель сообщает проблему — система сама определяет ответственного, объясняет порядок действий и сопровождает решение до результата. Житель не должен думать: куда обращаться, кто отвечает, как составить обращение, в какие сроки ответят.

Верни JSON со строгой схемой:
{
  "problem_type": "тип проблемы: освещение подъезда | ЖКХ | дороги | мусор | благоустройство | водоснабжение | отопление | лифт | другая",
  "urgency": "низкий | средний | высокий | критичный",
  "responsible_org": "ответственная организация: управляющая компания | администрация города | водоканал | электросети | дорожная служба | региональный оператор ТКО | другая",
  "deadline_days": число,
  "deadline_text": "Срок устранения: до X дней",
  "action_plan": "краткий порядок действий 1-2 шага"
}

Правила:
- urgency: критичный = угроза жизни/здоровью, высокий = нет света/воды/тепла, средний = мусор/ямы, низкий = косметика
- deadline_days: критичный 1, высокий 3, средний 7, низкий 14 (если иное не по нормативу)
- Отвечай только JSON, без ```json

"""

session = requests.Session()
session.verify = False
session.headers.update({"Authorization": TOKEN})

print(json.dumps(session.get(f"{API}/me").json(), ensure_ascii=False, indent=2))

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

client = GPTClient(GPT_TOKEN)
def send_msg(chat_id, text, attachment=None):
    body = {"text": text}
    if attachment:
        body["attachments"] = attachment
    r = session.post(f"{API}/messages", params={"chat_id": chat_id}, json=body)
    logger.info("{} {}", r.status_code, r.text)
    return r

waiting = set()

marker = None
while True:
    resp = session.get(f"{API}/updates", params={"marker": marker}, timeout=35).json()
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
                llm_text = asyncio.run(client.llm_request([
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": appeal}
                ]))
                data = json.loads(llm_text)
                name = update.get("message").get("sender").get("first_name")
                formed = {
                    "date": datetime.now(timezone.utc).isoformat(),
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