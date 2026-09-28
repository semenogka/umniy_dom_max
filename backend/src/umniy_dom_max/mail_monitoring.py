import asyncio
import random
import re

from loguru import logger

from umniy_dom_max.db.repository import get_appeal_by_mail_subject
from umniy_dom_max.handlers import APPEAL_MAIL_HEADERS, change_appeal_status

# "Re: ", "RE: ", "Fwd: ", "Ответ: " и их цепочки перед исходной темой
REPLY_PREFIX = re.compile(r"^(\s*(re|fwd?|aw|ответ)\s*:\s*)+", re.IGNORECASE)


def strip_quote(text: str) -> str:
    """Оставляет только ответ: отрезает цитату ("> ...") и шапку перед ней
    вида «Пн, 28 сент. 2026 г. в 16:10, <appeals@...>:»."""
    lines = text.splitlines()
    cut = next((i for i, line in enumerate(lines) if line.lstrip().startswith(">")), len(lines))
    body = "\n".join(lines[:cut]).rstrip()
    # шапка — последний абзац перед цитатой, заканчивается двоеточием (может занимать 2 строки)
    head, sep, last = body.rpartition("\n\n")
    if sep and last.endswith(":"):
        body = head
    return body.strip()


async def check_mailbox(agent, uk_agent, db, settings, ws, mail):
    # IMAP блокирующий. Письмо получает метку PROCESSED только после обработки,
    # при ошибке LLM или БД оно останется без метки и попадёт в следующий проход.
    # ponytail: письмо, которое падает всегда, будет перечитываться каждые 10 с — нужен счётчик попыток, если такое появится
    messages = await asyncio.to_thread(mail.read)
    done: list[bytes] = []
    try:
        for uid, msg in messages:
            try:
                if msg["X-Domovoy"] == APPEAL_MAIL_HEADERS["X-Domovoy"]:
                    # наше же письмо в УК: в демо-режиме отвечаем за УК, иначе просто пропускаем
                    if settings.uk_autoreply:
                        await reply_as_uk(uk_agent, mail, msg)
                else:
                    await handle_message(agent, db, settings, ws, mail, msg)
            except Exception:
                logger.exception("Письмо {} не обработано, повторим позже", uid)
                await db.rollback()
                continue
            done.append(uid)
    finally:
        await asyncio.to_thread(mail.mark_processed, done)


async def reply_as_uk(uk_agent, mail, msg):
    """Демо-УК: ответ от LLM «как человек» через 5–10 с, в ту же ветку письма."""
    # ponytail: пауза блокирует обработку остальных писем, при потоке обращений — отдельной задачей
    reply = (await uk_agent.run(mail.get_body(msg))).output.strip()
    await asyncio.sleep(random.uniform(5, 10))

    subject = str(msg["Subject"] or "")
    headers = {"In-Reply-To": msg["Message-ID"], "References": msg["Message-ID"]} if msg["Message-ID"] else {}
    await asyncio.to_thread(mail.send, to=mail.user, subject=f"Re: {subject}", text=reply, headers=headers)
    logger.info("Демо-УК ответила на «{}»", subject)


async def handle_message(agent, db, settings, ws, mail, msg):
    text = strip_quote(mail.get_body(msg))
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


async def mail_checker(agent, uk_agent, sessionmaker, settings, ws, mail):
    try:
        await asyncio.to_thread(mail.init_processed)
    except Exception:
        logger.exception("Не удалось разметить старые письма")
    while True:
        try:
            async with sessionmaker() as db:
                await check_mailbox(agent, uk_agent, db, settings, ws, mail)
        except Exception:
            logger.exception("Mail checker error")

        await asyncio.sleep(10)
