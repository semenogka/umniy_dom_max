import asyncio
import json
import sys

from sqlalchemy import select

from umniy_dom_max.db.database import create_engine, create_sessionmaker, init_db
from umniy_dom_max.db.models import Appeal, AppealMessage, House, HouseMessage, User
from umniy_dom_max.settings import Settings


async def amain(path: str):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    engine = create_engine(Settings().database_url)
    await init_db(engine)

    async with create_sessionmaker(engine)() as db:
        if await db.scalar(select(House).limit(1)):
            print("Дома уже есть — сид пропущен")
            await engine.dispose()
            return

        houses = {address: House(address=address) for address in data["houses"]}
        db.add_all(houses.values())

        for u in data["users"]:
            db.add(User(id=u["id"], name=u["name"], houses=[houses[a] for a in u["houses"]]))

        for a in data["appeals"]:
            messages = [AppealMessage(**m) for m in a.pop("messages")]
            address = a.pop("address")
            db.add(Appeal(**a, appeal_address=address, mail_subject=f"seed: {a['text']}", messages=messages))

        for m in data["house_messages"]:
            db.add(HouseMessage(house=houses[m.pop("address")], **m))

        await db.commit()

    await engine.dispose()
    print(f"Засеяно: домов {len(houses)}, пользователей {len(data['users'])}, обращений {len(data['appeals'])}")


def main():
    asyncio.run(amain(sys.argv[1] if len(sys.argv) > 1 else "/seed/data.json"))


if __name__ == "__main__":
    main()
