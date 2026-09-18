import os
import sys
import json
import requests
import urllib3
from dotenv import load_dotenv

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

TOKEN = os.getenv("MAX_TOKEN") or os.getenv("max_token")
if not TOKEN:
    raise RuntimeError("MAX_TOKEN не найден в backend/.env")

API = "https://platform-api2.max.ru"
session = requests.Session()
session.verify = False
session.headers.update({"Authorization": TOKEN})

print(json.dumps(session.get(f"{API}/me").json(), ensure_ascii=False, indent=2))

try:
    r = session.patch(f"{API}/me/commands", json={"commands": [
        {"name": "appeal", "description": "Написать обращение"},
        {"name": "start", "description": "Запустить бота"}
    ]})
    print("commands:", r.status_code, r.text)
except Exception as e:
    print("set commands error:", e)

waiting = set()

def send_message(chat_id, text, attachments=None):
    body = {"text": text}
    if attachments:
        body["attachments"] = attachments
    r = session.post(f"{API}/messages", params={"chat_id": chat_id}, json=body)
    print(f"send {r.status_code}: {r.text[:200]}")
    return r

def send_welcome(chat_id):
    attachments = [{
        "type": "inline_keyboard",
        "payload": {"buttons": [[{"type": "callback", "text": "Написать обращение", "payload": "write_appeal"}]]}
    }]
    send_message(chat_id, "Выберите действие (или /appeal у строки ввода):", attachments)

marker = None
while True:
    resp = session.get(f"{API}/updates", params={"marker": marker}, timeout=35).json()
    if "code" in resp:
        print(json.dumps(resp, ensure_ascii=False, indent=2))
        break
    marker = resp.get("marker")
    for update in resp.get("updates", []):
        t = update.get("update_type")
        chat_id = update.get("chat_id") or (update.get("message") or {}).get("recipient", {}).get("chat_id")
        if not chat_id and t == "message_callback":
            chat_id = (update.get("message") or {}).get("recipient", {}).get("chat_id")

        if t == "bot_started":
            send_welcome(chat_id)

        elif t == "message_created":
            text = (update.get("message") or {}).get("body", {}).get("text", "") or ""
            user_id = (update.get("message") or {}).get("sender", {}).get("user_id")
            norm = text.strip().lower()
            print(f"[{chat_id}] {text}")
            if norm in ("/start", "старт"):
                send_welcome(chat_id)
            elif norm in ("/appeal", "написать обращение", "обращение"):
                waiting.add(user_id or chat_id)
                send_message(chat_id, "Напишите текст обращения одним сообщением:")
            elif user_id in waiting or chat_id in waiting:
                waiting.discard(user_id)
                waiting.discard(chat_id)
                send_message(chat_id, "спасибо за обращение")
            else:
                pass

        elif t == "message_callback":
            payload = (update.get("callback") or {}).get("payload")
            callback_id = (update.get("callback") or {}).get("callback_id")
            user_id = update.get("user", {}).get("user_id") or (update.get("callback") or {}).get("user", {}).get("user_id")
            if callback_id:
                try:
                    session.post(f"{API}/answers", params={"callback_id": callback_id}, json={})
                except: pass
            if payload == "write_appeal":
                uid = user_id or chat_id
                waiting.add(uid)
                send_message(chat_id, "Напишите текст обращения одним сообщением:")
