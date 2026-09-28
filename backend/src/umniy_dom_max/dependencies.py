from collections.abc import AsyncIterator
from typing import Annotated

import fastapi
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from umniy_dom_max.llm import AppealAgent, AnswerAgent
from umniy_dom_max.mail import Mail
from umniy_dom_max.settings import Settings
from umniy_dom_max.ws import ConnectionManager


async def get_db(request: fastapi.Request) -> AsyncIterator[AsyncSession]:
    async with request.app.state.sessionmaker() as session:
        yield session


def get_appeal_agent(request: fastapi.Request) -> AppealAgent:
    return request.app.state.appeal_agent


def get_answer_agent(request: fastapi.Request) -> AnswerAgent:
    return request.app.state.answer_agent


def get_settings(request: fastapi.Request) -> Settings:
    return request.app.state.settings


def get_ws_manager(request: fastapi.Request) -> ConnectionManager:
    return request.app.state.ws_manager


def get_mail(request: fastapi.Request) -> Mail:
    return request.app.state.mail


DbSession = Annotated[AsyncSession, Depends(get_db)]
AppealAgentDep = Annotated[AppealAgent, Depends(get_appeal_agent)]
AnswerAgentDep = Annotated[AnswerAgent, Depends(get_answer_agent)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
WsManagerDep = Annotated[ConnectionManager, Depends(get_ws_manager)]
MailDep = Annotated[Mail, Depends(get_mail)]
