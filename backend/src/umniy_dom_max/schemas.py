from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AppealIn(BaseModel):
    text: str
    from_user_id: int
    from_name: str
    address: str


class StatusIn(BaseModel):
    status: str


class AddressIn(BaseModel):
    address: str


class DemoUserIn(BaseModel):
    from_user_id: int
    from_name: str


class HouseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    address: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender: str
    text: str
    is_read: bool
    created_at: datetime


class AppealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
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
    messages: list[MessageOut] = []


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    houses: list[HouseOut] = []
    appeals: list[AppealOut] = []
