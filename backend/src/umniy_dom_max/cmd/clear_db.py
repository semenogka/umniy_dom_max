import asyncio

from loguru import logger
from sqlalchemy import text

from umniy_dom_max.db.models import User, user_houses, Appeal, AppealMessage, HouseMessage # noqa: F401
from umniy_dom_max.db.database import Base, create_engine
from umniy_dom_max.settings import Settings

from sqlalchemy import delete

from sqlalchemy import select

async def delete_user(user_id: int):
    engine = create_engine("postgresql://maxenjoyers:r6tF5mg1j6mRgoTnMJ6HBwUJMiGj@82.146.33.58:5432/maxenjoyers")

    async with engine.begin() as conn:
        # 1. Удаляем связи пользователя с домами
        await conn.execute(
            user_houses.delete().where(user_houses.c.user_id == user_id)
        )

        # 2. Удаляем сообщения пользователя из обращений
        await conn.execute(
            delete(AppealMessage).where(
                AppealMessage.sender_id == user_id
            )
        )

        # 3. Удаляем сообщения пользователя домов
        await conn.execute(
            delete(HouseMessage).where(
                HouseMessage.sender_id == user_id
            )
        )

        # 4. Получаем обращения пользователя
        result = await conn.execute(
            select(Appeal.id).where(
                Appeal.author_id == user_id
            )
        )
        appeal_ids = result.scalars().all()

        # 5. Удаляем сообщения этих обращений
        if appeal_ids:
            await conn.execute(
                delete(AppealMessage).where(
                    AppealMessage.appeal_id.in_(appeal_ids)
                )
            )

        # 6. Удаляем сами обращения
        await conn.execute(
            delete(Appeal).where(
                Appeal.author_id == user_id
            )
        )

        # 7. И наконец пользователя
        await conn.execute(
            delete(User).where(User.id == user_id)
        )

    await engine.dispose()

    logger.info(f"Пользователь {user_id} удалён")


def main():
    asyncio.run(delete_user(469281732))


if __name__ == "__main__":
    main()
