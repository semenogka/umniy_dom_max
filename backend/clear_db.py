import asyncio
from sqlalchemy import text
from db.database import async_engine
from db.models import Base
import db.models

async def main():
    async with async_engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.run_sync(Base.metadata.create_all)
    print("База очищена и пересоздана")

asyncio.run(main())