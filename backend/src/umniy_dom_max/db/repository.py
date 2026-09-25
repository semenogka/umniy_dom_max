from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from umniy_dom_max.db.models import (
    Appeal,
    AppealMessage,
    House,
    HouseMessage,
    MessageAttachment,
    User,
)
from umniy_dom_max.llm import AppealClassification

APPEAL_MESSAGES = selectinload(Appeal.messages).selectinload(AppealMessage.attachments)
HOUSE_MESSAGES = selectinload(House.messages).selectinload(HouseMessage.attachments)


# пользователи


async def get_user(db: AsyncSession, user_id: int) -> User | None:
    return await db.get(User, user_id)


async def get_user_with_houses(db: AsyncSession, user_id: int) -> User | None:
    query = select(User).where(User.id == user_id).options(selectinload(User.houses))
    return await db.scalar(query)


async def get_user_full(db: AsyncSession, user_id: int) -> User | None:
    query = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.houses), selectinload(User.appeals))
    )
    return await db.scalar(query)


async def create_user(
    db: AsyncSession, user_id: int, name: str, chat_id: int, houses: list[House]
) -> User:
    db.add(User(id=user_id, name=name, max_chat_id=chat_id, houses=houses))
    await db.commit()
    return await get_user_full(db, user_id)


# обращения


async def get_appeal(db: AsyncSession, appeal_id: int) -> Appeal | None:
    return await db.get(Appeal, appeal_id)


async def get_appeal_detailed(db: AsyncSession, appeal_id: int) -> Appeal | None:
    return await db.scalar(
        select(Appeal).where(Appeal.id == appeal_id).options(APPEAL_MESSAGES)
    )


async def list_appeals_by_address(db: AsyncSession, address: str) -> list[Appeal]:
    query = (
        select(Appeal)
        .where(Appeal.appeal_address == address)
        .order_by(Appeal.created_at.desc())
    )
    return list(await db.scalars(query))


async def list_user_appeals(
    db: AsyncSession, user_id: int, with_messages: bool = False
) -> list[Appeal]:
    query = (
        select(Appeal)
        .where(Appeal.author_id == user_id)
        .order_by(Appeal.created_at.desc())
    )
    if with_messages:
        query = query.options(APPEAL_MESSAGES)
    return list(await db.scalars(query))


async def create_appeal(
    db: AsyncSession,
    author_id: int,
    address: str,
    text: str,
    attachments: list[str],
    classification: AppealClassification,
    bot_text: str,
) -> Appeal:
    appeal = Appeal(
        text=text,
        status="новое",
        author_id=author_id,
        appeal_address=address,
        organization=classification.responsible_org,
        problem_type=classification.problem_type,
        urgency=classification.urgency,
        deadline_days=classification.deadline_days,
        deadline_text=classification.deadline_text,
        action_plan=classification.action_plan,
    )
    db.add(appeal)
    await db.flush()
    await _add_appeal_message(db, appeal.id, "user", text, attachments)
    await _add_appeal_message(db, appeal.id, "bot", bot_text)
    await db.commit()
    return await get_appeal_detailed(db, appeal.id)


async def set_appeal_status(
    db: AsyncSession, appeal: Appeal, status: str, system_text: str | None
) -> None:
    appeal.status = status
    if system_text:
        db.add(AppealMessage(appeal_id=appeal.id, sender="system", text=system_text))
    await db.commit()


async def add_appeal_message(
    db: AsyncSession,
    appeal_id: int,
    sender: str,
    text: str,
    attachments: list[str],
    bot_text: str,
) -> AppealMessage:
    msg = await _add_appeal_message(db, appeal_id, sender, text, attachments)
    await _add_appeal_message(db, appeal_id, "bot", bot_text)
    await db.commit()
    query = (
        select(AppealMessage)
        .where(AppealMessage.id == msg.id)
        .options(selectinload(AppealMessage.attachments))
    )
    return await db.scalar(query)


async def _add_appeal_message(
    db: AsyncSession,
    appeal_id: int,
    sender: str,
    text: str,
    attachments: Sequence[str] = (),
) -> AppealMessage:
    msg = AppealMessage(appeal_id=appeal_id, sender=sender, text=text)
    db.add(msg)
    await db.flush()
    db.add_all(
        MessageAttachment(appeal_message_id=msg.id, url=url, ord=i)
        for i, url in enumerate(attachments)
    )
    return msg


# дома


async def get_house(db: AsyncSession, house_id: int) -> House | None:
    return await db.get(House, house_id)


async def get_house_detailed(db: AsyncSession, house_id: int) -> House | None:
    return await db.scalar(
        select(House).where(House.id == house_id).options(HOUSE_MESSAGES)
    )


async def get_house_by_address(db: AsyncSession, address: str) -> House | None:
    return await db.scalar(select(House).where(House.address == address))


async def get_random_houses(db: AsyncSession, limit: int) -> list[House]:
    return list(await db.scalars(select(House).order_by(func.random()).limit(limit)))


async def list_houses(db: AsyncSession) -> list[House]:
    return list(await db.scalars(select(House)))


async def create_house(db: AsyncSession, address: str) -> House:
    house = House(address=address)
    db.add(house)
    await db.commit()
    await db.refresh(house)
    return house


async def add_house_message(
    db: AsyncSession, house_id: int, sender: str, text: str, attachments: list[str]
) -> HouseMessage:
    msg = HouseMessage(house_id=house_id, sender=sender, text=text)
    db.add(msg)
    await db.flush()
    db.add_all(
        MessageAttachment(house_message_id=msg.id, url=url, ord=i)
        for i, url in enumerate(attachments)
    )
    await db.commit()
    query = (
        select(HouseMessage)
        .where(HouseMessage.id == msg.id)
        .options(selectinload(HouseMessage.attachments))
    )
    return await db.scalar(query)
