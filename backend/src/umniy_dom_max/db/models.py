from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, Table, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from umniy_dom_max.db.database import Base



class AppealMessage(Base):
    __tablename__="appeal_messages"
    id=Column(Integer, primary_key=True)
    appeal_id=Column(ForeignKey("appeals.id"), index=True, nullable=False)
    sender=Column(String)
    text=Column(Text, nullable=False)
    created_at=Column(DateTime(timezone=True), server_default=func.now())
    is_read=Column(Boolean, default=False)
    appeal=relationship("Appeal", back_populates="messages")
    attachments=relationship("MessageAttachment", cascade="all, delete-orphan")

user_houses = Table(
    "user_houses", Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("house_id", ForeignKey("houses.id"), primary_key=True)
)

class HouseMessage(Base):
    __tablename__="house_messages"
    id=Column(Integer, primary_key=True)
    house_id=Column(ForeignKey("houses.id"), index=True, nullable=False)
    sender=Column(String)
    text=Column(Text, nullable=False)
    created_at=Column(DateTime(timezone=True), server_default=func.now())
    is_read=Column(Boolean, default=False)
    house=relationship("House", back_populates="messages")
    attachments=relationship("MessageAttachment", cascade="all, delete-orphan")
    
class House(Base):
    __tablename__ = "houses"
    id = Column(Integer, primary_key=True)
    address = Column(String, unique=True) 
    users = relationship("User", secondary=user_houses, back_populates="houses")
    messages=relationship("HouseMessage", cascade="all, delete-orphan", order_by="HouseMessage.created_at")

class MessageAttachment(Base):
    __tablename__="message_attachments"
    id=Column(Integer, primary_key=True)
    appeal_message_id=Column(ForeignKey("appeal_messages.id", ondelete="CASCADE"), nullable=True, index=True)
    house_message_id=Column(ForeignKey("house_messages.id", ondelete="CASCADE"), nullable=True, index=True)
    url=Column(String); ord=Column(Integer)
    __table_args__=(CheckConstraint("(appeal_message_id IS NOT NULL) != (house_message_id IS NOT NULL)"),)



class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    max_chat_id = Column(Integer, nullable=True) 
    name = Column(String)
    houses = relationship("House", secondary=user_houses, back_populates="users")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appeals = relationship("Appeal", back_populates="author", cascade="all, delete-orphan")

class Appeal(Base):
    __tablename__ = "appeals"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)                  
    status = Column(String, default="новое")  
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appeal_address = Column(String, nullable=True)
    organization = Column(String, nullable=True)         

    problem_type = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    deadline_days = Column(Integer, nullable=True)
    deadline_text = Column(String, nullable=True)
    action_plan = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    messages=relationship("AppealMessage", cascade="all, delete-orphan", order_by="AppealMessage.created_at")

    author = relationship("User", back_populates="appeals")
