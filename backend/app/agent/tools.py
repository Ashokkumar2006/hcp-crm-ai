import uuid
from datetime import datetime, date

from app.agent.llm import call_llm_json, call_llm
from app.agent.state import AgentState
from app.models import HCP, Interaction, Material, Sample, FollowUpTask, InteractionMaterial, InteractionSample


# ============================================================
# TOOL 1 (mandatory): log_interaction
# Captures a free-text description of an HCP visit, uses the LLM
# to extract structured fields, and writes a new Interaction row.
# ============================================================
def log_interaction(state: AgentState) -> AgentState:
    db = state["db"]
    text = state["user_message"]

    extraction_prompt = [
        {
            "role": "system",
            "content": (
                "You extract structured CRM data from a pharma sales rep's description of an "
                "HCP (Healthcare Professional) interaction. Respond ONLY with a JSON object with "
                "these exact keys: hcp_name (string or null), interaction_type (string, default "
                "'Meeting'), topics_discussed (string), sentiment (one of: positive, neutral, "
                "negative), outcomes (string or null), materials (array of strings), "
                "samples (array of strings), attendees (array of strings)."
            ),
        },
        {"role": "user", "content": text},
    ]
    extracted = call_llm_json(extraction_prompt)
    state["extracted"] = extracted

    # Find or create the HCP by name (fuzzy match on name)
    hcp = None
    if extracted.get("hcp_name"):
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{extracted['hcp_name']}%")).first()
        if not hcp:
            hcp = HCP(id=str(uuid.uuid4()), name=extracted["hcp_name"])
            db.add(hcp)
            db.flush()

    interaction = Interaction(
        id=str(uuid.uuid4()),
        hcp_id=hcp.id if hcp else None,
        rep_id=state["rep_id"],
        date=date.today(),
        time=datetime.now().time(),
        interaction_type=extracted.get("interaction_type", "Meeting"),
        attendees=extracted.get("attendees", []),
        topics_discussed=extracted.get("topics_discussed", ""),
        sentiment=extracted.get("sentiment", "neutral"),
        outcomes=extracted.get("outcomes"),
        follow_up_actions=[],
        source="chat",
    )
    db.add(interaction)
    db.flush()

    # Attach materials/samples mentioned, matching by fuzzy name
    for material_name in extracted.get("materials", []):
        material = db.query(Material).filter(Material.name.ilike(f"%{material_name}%")).first()
        if material:
            db.add(InteractionMaterial(interaction_id=interaction.id, material_id=material.id))

    for sample_name in extracted.get("samples", []):
        sample = db.query(Sample).filter(Sample.name.ilike(f"%{sample_name}%")).first()
        if sample:
            db.add(InteractionSample(interaction_id=interaction.id, sample_id=sample.id))

    db.commit()
    db.refresh(interaction)

    state["interaction_id"] = interaction.id
    state["tool_result"] = {
        "interaction_id": interaction.id,
        "hcp_name": hcp.name if hcp else extracted.get("hcp_name"),
        "sentiment": interaction.sentiment,
        "topics_discussed": interaction.topics_discussed,
    }
    return state


# ============================================================
# TOOL 2 (mandatory): edit_interaction
# Takes a natural-language edit instruction and patches only the
# fields the rep actually asked to change.
# ============================================================
def edit_interaction(state: AgentState) -> AgentState:
    db = state["db"]
    interaction_id = state.get("interaction_id")

    if not interaction_id:
        state["tool_result"] = {"error": "No interaction_id provided to edit."}
        return state

    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        state["tool_result"] = {"error": f"Interaction {interaction_id} not found."}
        return state

    current_snapshot = {
        "topics_discussed": interaction.topics_discussed,
        "sentiment": interaction.sentiment,
        "outcomes": interaction.outcomes,
        "attendees": interaction.attendees,
        "follow_up_actions": interaction.follow_up_actions,
    }

    edit_prompt = [
        {
            "role": "system",
            "content": (
                "You interpret an edit instruction against a current CRM interaction record and "
                "output ONLY a JSON object containing just the fields that should change, using "
                "the same keys as the current record. Do not include unchanged fields. Valid "
                "sentiment values: positive, neutral, negative."
            ),
        },
        {
            "role": "user",
            "content": f"Current record: {current_snapshot}\n\nEdit instruction: {state['user_message']}",
        },
    ]
    patch = call_llm_json(edit_prompt)

    for key, value in patch.items():
        if hasattr(interaction, key):
            setattr(interaction, key, value)

    interaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interaction)

    state["tool_result"] = {"interaction_id": interaction.id, "updated_fields": patch}
    return state


# ============================================================
# TOOL 3: suggest_followups
# Generates 2-4 recommended next actions after an interaction is logged.
# ============================================================
def suggest_followups(state: AgentState) -> AgentState:
    db = state["db"]
    interaction_id = state.get("interaction_id")
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first() if interaction_id else None

    context = interaction.topics_discussed if interaction else state["user_message"]

    prompt = [
        {
            "role": "system",
            "content": (
                "Given the summary of a pharma sales rep's HCP interaction, suggest 2-4 concrete "
                "follow-up actions (e.g. 'Schedule follow-up meeting in 2 weeks', 'Send Phase III "
                "PDF'). Respond ONLY with a JSON object: {\"followups\": [\"...\", \"...\"]}"
            ),
        },
        {"role": "user", "content": context or "No details provided."},
    ]
    result = call_llm_json(prompt)
    followups = result.get("followups", [])

    if interaction:
        for description in followups:
            db.add(FollowUpTask(
                id=str(uuid.uuid4()),
                interaction_id=interaction.id,
                description=description,
                status="pending",
                ai_generated=True,
            ))
        db.commit()

    state["tool_result"] = {"followups": followups}
    return state


# ============================================================
# TOOL 4: search_materials
# Lets the agent (or rep, via chat) find catalog items by keyword
# without leaving the conversation.
# ============================================================
def search_materials(state: AgentState) -> AgentState:
    db = state["db"]
    keyword = state["user_message"]

    materials = db.query(Material).filter(Material.name.ilike(f"%{keyword}%")).limit(5).all()
    samples = db.query(Sample).filter(Sample.name.ilike(f"%{keyword}%")).limit(5).all()

    state["tool_result"] = {
        "materials": [{"id": m.id, "name": m.name} for m in materials],
        "samples": [{"id": s.id, "name": s.name} for s in samples],
    }
    return state


# ============================================================
# TOOL 5: sentiment_analysis
# Infers HCP sentiment from conversation text when the rep hasn't
# explicitly stated it.
# ============================================================
def sentiment_analysis(state: AgentState) -> AgentState:
    db = state["db"]
    text = state["user_message"]

    prompt = [
        {
            "role": "system",
            "content": (
                "Classify the HCP's sentiment expressed in this text as exactly one word: "
                "positive, neutral, or negative. Respond ONLY with a JSON object: "
                "{\"sentiment\": \"...\"}"
            ),
        },
        {"role": "user", "content": text},
    ]
    result = call_llm_json(prompt)
    sentiment = result.get("sentiment", "neutral")

    interaction_id = state.get("interaction_id")
    if interaction_id:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if interaction:
            interaction.sentiment = sentiment
            db.commit()

    state["tool_result"] = {"sentiment": sentiment}
    return state


# ============================================================
# Fallback: general_chat — for messages that don't map to a tool
# ============================================================
def general_chat(state: AgentState) -> AgentState:
    prompt = [
        {
            "role": "system",
            "content": (
                "You are an AI assistant embedded in a pharma CRM's HCP interaction logging "
                "screen. Help the rep log or manage interaction data. Keep replies short."
            ),
        },
        {"role": "user", "content": state["user_message"]},
    ]
    reply = call_llm(prompt)
    state["tool_result"] = {"reply": reply}
    return state
