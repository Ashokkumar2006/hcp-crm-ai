import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Enum, Boolean, Date, Time, Integer
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db import Base


def gen_uuid():
    return str(uuid.uuid4())


class SentimentEnum(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class SourceEnum(str, enum.Enum):
    form = "form"
    chat = "chat"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="rep")  # rep | manager
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="rep")


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    specialty = Column(String)
    hospital_or_clinic = Column(String)
    contact_info = Column(String)

    interactions = relationship("Interaction", back_populates="hcp")


class Material(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    type = Column(String)


class Sample(Base):
    __tablename__ = "samples"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    product_line = Column(String)


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    hcp_id = Column(UUID(as_uuid=False), ForeignKey("hcps.id"), nullable=False)
    rep_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    interaction_type = Column(String, default="Meeting")

    attendees = Column(JSONB, default=list)          # list[str]
    topics_discussed = Column(Text)
    sentiment = Column(Enum(SentimentEnum), default=SentimentEnum.neutral)
    outcomes = Column(Text)
    follow_up_actions = Column(JSONB, default=list)   # list[str] or list[dict]

    source = Column(Enum(SourceEnum), default=SourceEnum.form)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")
    rep = relationship("User", back_populates="interactions")
    materials = relationship("InteractionMaterial", back_populates="interaction")
    samples = relationship("InteractionSample", back_populates="interaction")
    followups = relationship("FollowUpTask", back_populates="interaction")


class InteractionMaterial(Base):
    __tablename__ = "interaction_materials"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    interaction_id = Column(UUID(as_uuid=False), ForeignKey("interactions.id"))
    material_id = Column(UUID(as_uuid=False), ForeignKey("materials.id"))

    interaction = relationship("Interaction", back_populates="materials")
    material = relationship("Material")


class InteractionSample(Base):
    __tablename__ = "interaction_samples"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    interaction_id = Column(UUID(as_uuid=False), ForeignKey("interactions.id"))
    sample_id = Column(UUID(as_uuid=False), ForeignKey("samples.id"))
    quantity = Column(Integer, default=1)

    interaction = relationship("Interaction", back_populates="samples")
    sample = relationship("Sample")


class FollowUpTask(Base):
    __tablename__ = "followup_tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    interaction_id = Column(UUID(as_uuid=False), ForeignKey("interactions.id"))
    description = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending | done
    due_date = Column(Date, nullable=True)
    ai_generated = Column(Boolean, default=False)

    interaction = relationship("Interaction", back_populates="followups")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    interaction_id = Column(UUID(as_uuid=False), ForeignKey("interactions.id"), nullable=True)
    messages = Column(JSONB, default=list)      # [{role, content, timestamp}]
    agent_state = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
