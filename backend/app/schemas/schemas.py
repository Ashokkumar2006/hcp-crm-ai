import datetime
from typing import Optional, List
from pydantic import BaseModel


# ---------- HCP ----------
class HCPOut(BaseModel):
    id: str
    name: str
    specialty: Optional[str] = None
    hospital_or_clinic: Optional[str] = None
    contact_info: Optional[str] = None

    class Config:
        from_attributes = True


class HCPMini(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


class HCPCreate(BaseModel):
    name: str
    specialty: Optional[str] = None
    hospital_or_clinic: Optional[str] = None
    contact_info: Optional[str] = None


# ---------- Material / Sample ----------
class MaterialOut(BaseModel):
    id: str
    name: str
    type: Optional[str] = None

    class Config:
        from_attributes = True


class SampleOut(BaseModel):
    id: str
    name: str
    product_line: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- FollowUpTask ----------
class FollowUpTaskOut(BaseModel):
    id: str
    description: str
    status: str
    due_date: Optional[datetime.date] = None
    ai_generated: bool

    class Config:
        from_attributes = True


# ---------- Interaction ----------
class InteractionCreate(BaseModel):
    hcp_id: str
    rep_id: str
    date: datetime.date
    time: datetime.time
    interaction_type: str = "Meeting"
    attendees: List[str] = []
    topics_discussed: Optional[str] = None
    sentiment: Optional[str] = "neutral"
    outcomes: Optional[str] = None
    follow_up_actions: List[str] = []
    material_ids: List[str] = []
    sample_ids: List[str] = []


class InteractionUpdate(BaseModel):
    """All fields optional — only send what changed (used for both the
    PUT endpoint and the edit_interaction agent tool)."""
    hcp_id: Optional[str] = None
    date: Optional[datetime.date] = None
    time: Optional[datetime.time] = None
    interaction_type: Optional[str] = None
    attendees: Optional[List[str]] = None
    topics_discussed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[List[str]] = None
    material_ids: Optional[List[str]] = None
    sample_ids: Optional[List[str]] = None


class InteractionOut(BaseModel):
    id: str
    hcp_id: str
    rep_id: str
    date: datetime.date
    time: datetime.time
    interaction_type: str
    attendees: List[str]
    topics_discussed: Optional[str] = None
    sentiment: str
    outcomes: Optional[str] = None
    follow_up_actions: List[str]
    source: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    hcp: Optional[HCPMini] = None
    materials: List[MaterialOut] = []
    samples: List[SampleOut] = []

    class Config:
        from_attributes = True


# ---------- Agent Chat ----------
class ChatRequest(BaseModel):
    message: str
    rep_id: str
    interaction_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    intent: str
    interaction_id: Optional[str] = None
    tool_result: Optional[dict] = None