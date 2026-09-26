from datetime import datetime

from pydantic import BaseModel, ConfigDict

class AttachmentOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id:int 
    url:str 
    ord:int

class AppealIn(BaseModel):
    text: str
    user_id: int
    address: str
    attachments: list[str] = []

class StatusIn(BaseModel):
    status: str


class AddressIn(BaseModel):
    address: str


class DemoUserIn(BaseModel):
    user_id: int
    chat_id: int
    name: str

class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender: str
    text: str
    created_at: datetime
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
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    houses: list[HouseOut] = []
    appeals: list[AppealOut] = []
