import asyncio

from sqlalchemy import text

import umniy_dom_max.db.models  # noqa: F401
from umniy_dom_max.db.database import Base, create_engine
from umniy_dom_max.settings import Settings


async def amain():
    engine = create_engine(Settings().database_url)
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("База очищена и пересоздана")


def main():
    asyncio.run(amain())


if __name__ == "__main__":
    main()
