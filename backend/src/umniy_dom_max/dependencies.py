from collections.abc import AsyncIterator
from typing import Annotated

import fastapi
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from umniy_dom_max.llm import AppealAgent
from umniy_dom_max.settings import Settings


async def get_db(request: fastapi.Request) -> AsyncIterator[AsyncSession]:
    async with request.app.state.sessionmaker() as session:
        yield session


def get_appeal_agent(request: fastapi.Request) -> AppealAgent:
    return request.app.state.appeal_agent


def get_settings(request: fastapi.Request) -> Settings:
    return request.app.state.settings


DbSession = Annotated[AsyncSession, Depends(get_db)]
AppealAgentDep = Annotated[AppealAgent, Depends(get_appeal_agent)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
