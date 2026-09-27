from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def create_engine(database_url: str) -> AsyncEngine:
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return create_async_engine(database_url, echo=False)


def create_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_db(engine: AsyncEngine) -> None:
    import umniy_dom_max.db.models  # noqa: F401
    from umniy_dom_max.db.models import User

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with engine.begin() as conn:
        from sqlalchemy import select
        result = await conn.execute(select(User).where(User.id == 0))
        if result.scalar_one_or_none() is None:
            await conn.execute(
                User.__table__.insert().values(id=0, name="bot", max_chat_id=None)
            )
