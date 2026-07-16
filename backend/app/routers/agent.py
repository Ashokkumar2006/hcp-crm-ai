from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.agent.graph import agent_graph
from app.schemas.schemas import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    initial_state = {
        "db": db,
        "rep_id": payload.rep_id,
        "interaction_id": payload.interaction_id,
        "user_message": payload.message,
    }

    final_state = agent_graph.invoke(initial_state)

    return ChatResponse(
        response=final_state.get("response", ""),
        intent=final_state.get("intent", "general_chat"),
        interaction_id=final_state.get("interaction_id"),
        tool_result=final_state.get("tool_result"),
    )
