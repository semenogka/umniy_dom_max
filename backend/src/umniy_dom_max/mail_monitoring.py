import asyncio
import re

from loguru import logger

from umniy_dom_max.db.repository import get_appeal_by_mail_subject
from umniy_dom_max.handlers import change_appeal_status

# "Re: ", "RE: ", "Fwd: ", "Ответ: " и их цепочки перед исходной темой
REPLY_PREFIX = re.compile(r"^(\s*(re|fwd?|aw|ответ)\s*:\s*)+", re.IGNORECASE)


async def check_mailbox(agent, db, settings, ws, mail):
    # IMAP блокирующий. Письмо помечается прочитанным только после обработки,
    # при ошибке LLM или БД оно останется непрочитанным и попадёт в следующий проход.
    # ponytail: письмо, которое падает всегда, будет перечитываться каждые 10 с — нужен счётчик попыток, если такое появится
    messages = await asyncio.to_thread(mail.read)
    done: list[bytes] = []
    try:
        for uid, msg in messages:
            try:
                await handle_message(agent, db, settings, ws, mail, msg)
            except Exception:
                logger.exception("Письмо {} не обработано, повторим позже", uid)
                await db.rollback()
                continue
            done.append(uid)
    finally:
        await asyncio.to_thread(mail.mark_seen, done)


async def handle_message(agent, db, settings, ws, mail, msg):
    text = mail.get_body(msg)
    classification = (await agent.run(text)).output
    if classification.result == "N":
        return

    subject = REPLY_PREFIX.sub("", str(msg["Subject"] or ""))
    appeal = await get_appeal_by_mail_subject(db, subject)
    if not appeal:
        logger.info("Обращение по теме письма не найдено: {}", subject)
        return

    await change_appeal_status(db, settings, ws, appeal, classification.result, text)
    logger.info("Обращение {} → {}", appeal.id, classification.result)


async def mail_checker(agent, sessionmaker, settings, ws, mail):
    while True:
        try:
            async with sessionmaker() as db:
                await check_mailbox(agent, db, settings, ws, mail)
        except Exception:
            logger.exception("Mail checker error")

        await asyncio.sleep(10)
