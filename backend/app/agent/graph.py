from langgraph.graph import StateGraph, END

from app.agent.state import AgentState
from app.agent.llm import call_llm_json
from app.agent.tools import (
    log_interaction,
    edit_interaction,
    suggest_followups,
    search_materials,
    sentiment_analysis,
    general_chat,
)

VALID_INTENTS = [
    "log_interaction",
    "edit_interaction",
    "suggest_followups",
    "search_materials",
    "sentiment_analysis",
    "general_chat",
]


def classify_intent(state: AgentState) -> AgentState:
    """
    The router node. Decides which of the 5 tools (or general chat)
    this message should be handled by.
    """
    editing = bool(state.get("interaction_id"))

    prompt = [
        {
            "role": "system",
            "content": (
                "Classify the pharma sales rep's message into exactly one intent from this list: "
                f"{VALID_INTENTS}. "
                f"An interaction is currently {'already open for editing' if editing else 'NOT yet open'}. "
                "If the rep is describing a new visit/interaction, use log_interaction. "
                "If they're asking to change/correct something on an already-open interaction, use edit_interaction. "
                "If they ask what to do next, use suggest_followups. "
                "If they ask to find a brochure/sample/material, use search_materials. "
                "If they ask about HCP sentiment/mood specifically, use sentiment_analysis. "
                "Otherwise use general_chat. "
                "Respond ONLY with JSON: {\"intent\": \"...\"}"
            ),
        },
        {"role": "user", "content": state["user_message"]},
    ]
    result = call_llm_json(prompt)
    intent = result.get("intent", "general_chat")
    state["intent"] = intent if intent in VALID_INTENTS else "general_chat"
    return state


def finalize_response(state: AgentState) -> AgentState:
    """Turns the raw tool_result into a short natural-language reply for the chat UI."""
    intent = state["intent"]
    result = state.get("tool_result", {})

    if intent == "log_interaction":
        state["response"] = (
            f"Logged interaction with {result.get('hcp_name', 'the HCP')}. "
            f"Sentiment: {result.get('sentiment')}. Topics: {result.get('topics_discussed')}"
        )
    elif intent == "edit_interaction":
        if "error" in result:
            state["response"] = result["error"]
        else:
            state["response"] = f"Updated: {', '.join(result.get('updated_fields', {}).keys())}"
    elif intent == "suggest_followups":
        followups = result.get("followups", [])
        state["response"] = "Suggested follow-ups:\n" + "\n".join(f"- {f}" for f in followups)
    elif intent == "search_materials":
        mats = [m["name"] for m in result.get("materials", [])]
        samps = [s["name"] for s in result.get("samples", [])]
        state["response"] = f"Materials: {mats or 'none found'} | Samples: {samps or 'none found'}"
    elif intent == "sentiment_analysis":
        state["response"] = f"Inferred sentiment: {result.get('sentiment')}"
    else:
        state["response"] = result.get("reply", "How can I help you log this interaction?")

    return state


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("classify_intent", classify_intent)
    graph.add_node("log_interaction", log_interaction)
    graph.add_node("edit_interaction", edit_interaction)
    graph.add_node("suggest_followups", suggest_followups)
    graph.add_node("search_materials", search_materials)
    graph.add_node("sentiment_analysis", sentiment_analysis)
    graph.add_node("general_chat", general_chat)
    graph.add_node("finalize_response", finalize_response)

    graph.set_entry_point("classify_intent")

    graph.add_conditional_edges(
        "classify_intent",
        lambda state: state["intent"],
        {
            "log_interaction": "log_interaction",
            "edit_interaction": "edit_interaction",
            "suggest_followups": "suggest_followups",
            "search_materials": "search_materials",
            "sentiment_analysis": "sentiment_analysis",
            "general_chat": "general_chat",
        },
    )

    for tool_node in [
        "log_interaction", "edit_interaction", "suggest_followups",
        "search_materials", "sentiment_analysis", "general_chat",
    ]:
        graph.add_edge(tool_node, "finalize_response")

    graph.add_edge("finalize_response", END)

    return graph.compile()


# Compiled once at import time, reused across requests
agent_graph = build_graph()
