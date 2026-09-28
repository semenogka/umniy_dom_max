import asyncio
import logging
import traceback
from contextlib import asynccontextmanager

import fastapi
import uvicorn
from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.cors import CORSMiddleware

from umniy_dom_max.db.database import create_engine, create_sessionmaker, init_db
from umniy_dom_max.handlers import router
from umniy_dom_max.llm import (
    create_addition_agent,
    create_answer_agent,
    create_appeal_agent,
    create_uk_agent,
)
from umniy_dom_max.mail import Mail
from umniy_dom_max.mail_monitoring import mail_checker
from umniy_dom_max.settings import Settings
from umniy_dom_max.ws import ConnectionManager

TAGS_METADATA = [
    {
        "name": "Пользователи",
        "description": "Регистрация пользователей (через MAX) и получение информации о них: "
        "профиль, привязанные дома, история обращений.",
    },
    {
        "name": "Обращения",
        "description": "Обращения жителей по проблемам в доме: создание, классификация текста через LLM, "
        "переписка (доп. сообщения) и изменение статуса с уведомлением в чат MAX.",
    },
    {
        "name": "Дома",
        "description": "Дома, привязанные к пользователям, и общий чат дома, не относящийся к конкретному обращению.",
    },
]


def main():
    settings = Settings()
    logging.basicConfig(level=settings.log_level)

    @asynccontextmanager
    async def lifespan(app: fastapi.FastAPI):
        engine = create_engine(settings.database_url)
        await init_db(engine)

        app.state.settings = settings
        app.state.sessionmaker = create_sessionmaker(engine)
        app.state.appeal_agent = create_appeal_agent(settings)
        app.state.addition_agent = create_addition_agent(settings)
        app.state.answer_agent = create_answer_agent(settings)
        app.state.ws_manager = ConnectionManager()
        app.state.mail = Mail(settings.mail_host, settings.mail_user, settings.mail_password)

        app.state.mail_task = asyncio.create_task(
            mail_checker(
                app.state.answer_agent,
                create_uk_agent(settings),
                app.state.sessionmaker,
                settings,
                app.state.ws_manager,
                app.state.mail,
            )
        )

        yield

        app.state.mail_task.cancel()
        await engine.dispose()

    app = fastapi.FastAPI(
        title="Hack MAX API",
        description="API бота «Умный дом» для MAX: обращения жителей по проблемам дома, "
        "их классификация и переписка с управляющей компанией.",
        openapi_tags=TAGS_METADATA,
        lifespan=lifespan,
        root_path=settings.root_path,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
    )

    if settings.enable_cors:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.exception_handler(Exception)
    async def server_error_handler(request: Request, exc: Exception):
        if settings.debug:
            return JSONResponse(
                status_code=500,
                content={"detail": traceback.format_exc()},
                media_type="application/json; charset=utf-8",
            )
        logger.opt(exception=exc).error("Internal server error")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            media_type="application/json; charset=utf-8",
        )

    app.include_router(router)

    uvicorn.run(app, host=settings.host, port=settings.port)


if __name__ == "__main__":
    main()
