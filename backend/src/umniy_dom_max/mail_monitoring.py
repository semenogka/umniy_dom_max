import asyncio
import re

from umniy_dom_max.mail import Mail
from umniy_dom_max.settings import Settings
from umniy_dom_max.db.repository import get_appeal_by_mail_subject
from umniy_dom_max.handlers import update_appeal_status
from umniy_dom_max.schemas import StatusIn

settings = Settings()
mail = Mail(
    settings.mail_host,
    settings.mail_user,
    settings.mail_password,
)

# "Re: ", "RE: ", "Fwd: ", "Ответ: " и их цепочки перед исходной темой
REPLY_PREFIX = re.compile(r"^(\s*(re|fwd?|aw|ответ)\s*:\s*)+", re.IGNORECASE)


async def check_answer(agent, db, settings, ws):
    # IMAP блокирующий, а read() помечает письма прочитанными — читаем один раз
    messages = await asyncio.to_thread(mail.read)
    print("check", len(messages))
    for msg in messages:
        text = mail.get_body(msg)
        print(text)
        try:
            classification = (await agent.run(text)).output
        except Exception as e:
            print(f"LLM error: {e}")
            continue

        if classification.result == "N":
            continue

        sub = REPLY_PREFIX.sub("", str(msg["Subject"] or ""))
        print(sub, classification.result)
        appeal = await get_appeal_by_mail_subject(db, sub)

        if not appeal:
            print(f"Appeal not found: {sub}")
            continue

        try:
            await update_appeal_status(
                appeal.id,
                StatusIn(status=classification.result, mail_text=text),
                db,
                settings,
                ws,
            )
            print(f"Updated appeal {appeal.id}")
        except Exception as e:
            print(f"Update error: {e}")


async def mail_checker(agent, sessionmaker, settings, ws):
    while True:
        try:
            async with sessionmaker() as db:
                await check_answer(agent, db, settings, ws)
        except Exception as e:
            print(f"Mail checker error: {e}")

        await asyncio.sleep(10)
