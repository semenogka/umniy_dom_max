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
import asyncio
# Имя системного пользователя (id=0), от которого пишет бот
BOT_NAME = "Домовой"

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
    db: AsyncSession,
    user_id: int,
    name: str,
    chat_id: int,
    houses: list[House],
    avatar_url: str | None = None,
) -> User:
    db.add(User(id=user_id, name=name, max_chat_id=chat_id, houses=houses, avatar_url=avatar_url))
    await db.commit()
    return await get_user_full(db, user_id)


# обращения


async def get_appeal(db: AsyncSession, appeal_id: int) -> Appeal | None:
    return await db.get(Appeal, appeal_id)

async def get_appeal_by_mail_subject(db: AsyncSession, subject: str) -> Appeal | None:
    return await db.scalar(select(Appeal).where(Appeal.mail_subject == subject))

async def get_appeal_detailed(db: AsyncSession, appeal_id: int) -> Appeal | None:
    return await db.scalar(
        select(Appeal).where(Appeal.id == appeal_id).options(APPEAL_MESSAGES)
    )


async def list_appeals_by_house_id(db: AsyncSession, house_id: int) -> list[Appeal]:
    query = (
        select(Appeal)
        .where(Appeal.house_id == house_id)
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
    house: House,
    text: str,
    attachments: list[str],
    classification: AppealClassification,
    bot_text: str,
    mail_subject: str,
    user_name: str,
) -> Appeal:
    appeal = Appeal(
        text=text,
        title=classification.title,
        status="in_progress",
        author_id=author_id,
        house_id=house.id,
        appeal_address=house.address,
        organization=classification.responsible_org,
        problem_type=classification.problem_type,
        urgency=classification.urgency,
        deadline_days=classification.deadline_days,
        deadline_text=classification.deadline_text,
        action_plan=classification.action_plan,
        mail_subject=mail_subject,
    )
    db.add(appeal)
    await db.flush()
    await _add_appeal_message(db, appeal.id, author_id, user_name, text, attachments)
    await asyncio.sleep(1)
    await _add_appeal_message(db, appeal.id, 0, BOT_NAME, bot_text)
    await db.commit()
    return await get_appeal_detailed(db, appeal.id)


async def set_appeal_status(
    db: AsyncSession, appeal: Appeal, status: str, system_text: str | None
) -> AppealMessage | None:
    appeal.status = status
    system_msg: AppealMessage | None = None
    if system_text:
        system_msg = AppealMessage(
            appeal_id=appeal.id, sender_id=0, sender=BOT_NAME, text=system_text
        )
        db.add(system_msg)
    await db.commit()
    if system_msg is not None:
        await db.refresh(system_msg)
    return system_msg


async def add_appeal_message(
    db: AsyncSession,
    appeal_id: int,
    sender_id: int,
    sender: str,
    text: str,
    attachments: list[str],
    bot_text: str,
) -> list[AppealMessage]:
    """Сообщение жителя и ответ бота, в порядке создания."""
    ids = [(await _add_appeal_message(db, appeal_id, sender_id, sender, text, attachments)).id]
    if bot_text:
        ids.append((await _add_appeal_message(db, appeal_id, 0, BOT_NAME, bot_text)).id)
    await db.commit()
    query = (
        select(AppealMessage)
        .where(AppealMessage.id.in_(ids))
        .options(selectinload(AppealMessage.attachments))
        .order_by(AppealMessage.id)
    )
    return list(await db.scalars(query))

async def _add_appeal_message(
    db: AsyncSession,
    appeal_id: int,
    sender_id: int,
    sender: str,
    text: str,
    attachments: Sequence[str] = (),
) -> AppealMessage:
    msg = AppealMessage(appeal_id=appeal_id, sender_id=sender_id, sender=sender, text=text)
    db.add(msg)
    await db.flush()
    
    db.add_all(
        MessageAttachment(appeal_message_id=msg.id, url=url, ord=i)
        for i, url in enumerate(attachments or [])
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
    db: AsyncSession, house_id: int, sender_id: int, sender: str, text: str, attachments: list[str]
) -> HouseMessage:
    msg = HouseMessage(house_id=house_id, sender_id=sender_id, sender=sender, text=text)
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


async def _mark_messages_read(
    db: AsyncSession,
    model: type[HouseMessage] | type[AppealMessage],
    scope_column,
    scope_id: int,
    reader_id: int,
    message_ids: Sequence[int],
) -> list[int]:
    if not message_ids:
        return []

    result = await db.scalars(
        select(model).where(
            scope_column == scope_id,
            model.id.in_(list(message_ids)),
            model.sender_id != reader_id,
            model.is_read.is_(False),
        )
    )
    messages = list(result)
    for message in messages:
        message.is_read = True

    if messages:
        await db.commit()

    return [message.id for message in messages]


async def mark_house_messages_read(
    db: AsyncSession, house_id: int, reader_id: int, message_ids: Sequence[int]
) -> list[int]:
    return await _mark_messages_read(
        db, HouseMessage, HouseMessage.house_id, house_id, reader_id, message_ids
    )


async def mark_appeal_messages_read(
    db: AsyncSession, appeal_id: int, reader_id: int, message_ids: Sequence[int]
) -> list[int]:
    return await _mark_messages_read(
        db, AppealMessage, AppealMessage.appeal_id, appeal_id, reader_id, message_ids
    )

