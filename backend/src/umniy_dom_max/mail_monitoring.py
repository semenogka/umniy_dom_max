import asyncio
import requests
from contextlib import asynccontextmanager
from fastapi import FastAPI

from umniy_dom_max.mail import Mail
from umniy_dom_max.settings import Settings
from umniy_dom_max.dependencies import AnswerAgentDep
from umniy_dom_max.db.repository import get_appeal_by_mail_subject
from umniy_dom_max.schemas import StatusIn

settings = Settings()
mail = Mail(
    settings.mail_host,
    settings.mail_user,
    settings.mail_password,
)


async def check_answer(agent: AnswerAgentDep, db):
    for msg in mail.read():
        text = mail.get_body(msg)

        try:
            classification = (await agent.run(text)).output
        except Exception as e:
            print(f"LLM error: {e}")
            continue

        if classification.result == "N":
            continue
        if classification.result == "dop":
            bot_text = "Статус изменен. Запрашивают дополнительные данные для обращения."
        if classification.result == "checked":
            bot_text = "Статус изменен. Ваш запрос проверен."

        sub = msg["Subject"][4:]
        print(sub)
        appeal = await get_appeal_by_mail_subject(db, sub)

        if not appeal:
            print(f"Appeal not found: {sub}")
            continue

        try:
            requests.post(
                f"https://domovoy.stirkk.ru/appeals/{appeal.id}/update",
                json=StatusIn(status=classification.result, mail_text=text).model_dump(),
                timeout=30,
            )
            print(f"Updated appeal {appeal.id}")
        except Exception as e:
            print(f"Update error: {e}")


async def mail_checker(agent, sessionmaker):
    while True:
        try:
            async with sessionmaker() as db:
                await check_answer(agent, db)
        except Exception as e:
            print(f"Mail checker error: {e}")

        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(mail_checker(app.state.answer_agent, app.state.sessionmaker))

    yield

    task.cancel()


app = FastAPI(lifespan=lifespan)
