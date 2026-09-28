from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["in_progress", "dop", "checked", "close"]
STATUS_LABELS: dict[str, str] = {
    "in_progress": "В работе",
    "dop": "Дополните",
    "checked": "Проверено",
    "close": "Закрыто",
}

class AttachmentOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id:int 
    url:str 
    ord:int

class AppealIn(BaseModel):
    text: str
    user_id: int
    house_id: int
    attachments: list[str] = []

class StatusIn(BaseModel):
    status: Status
    mail_text: str


class AddressIn(BaseModel):
    address: str


class DemoUserIn(BaseModel):
    user_id: int
    chat_id: int
    name: str

class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    sender: str
    text: str
    created_at: datetime
    is_read: bool = False
    attachments: list[AttachmentOut] = []

class MessageIn(BaseModel):
    text: str
    user_id: int
    attachments: list[str] = []

class HouseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    address: str

class HouseDetailOut(HouseOut):
    messages: list[MessageOut] = []


class AppealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    title: str | None = None
    status: str
    author_id: int
    appeal_address: str | None
    organization: str | None
    problem_type: str | None
    urgency: str | None
    deadline_days: int | None
    deadline_text: str | None
    action_plan: str | None
    created_at: datetime | None

class AppealDetailedOut(AppealOut):
    messages: list[MessageOut] = []

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    chat_id: int | None = Field(default=None, alias="max_chat_id")
    name: str
    houses: list[HouseOut] = []
    appeals: list[AppealOut] = []
