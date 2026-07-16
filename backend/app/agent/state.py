from typing import TypedDict, Optional, Any, List, Dict


class AgentState(TypedDict, total=False):
    db: Any                          # SQLAlchemy session, passed through for tool nodes
    rep_id: str
    interaction_id: Optional[str]    # set if editing an existing interaction
    user_message: str
    intent: str                      # decided by classify_intent node
    extracted: Dict                  # structured data pulled out by the LLM
    tool_result: Dict                # what the tool node produced
    response: str                    # final natural-language reply to the user
