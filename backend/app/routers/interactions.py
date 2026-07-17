from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db import get_db
from app.models import Interaction, InteractionMaterial, InteractionSample
from app.schemas.schemas import InteractionCreate, InteractionUpdate, InteractionOut

router = APIRouter()


def serialize_interaction(interaction: Interaction) -> dict:
    """
    Builds the full response dict including nested HCP name and
    materials/samples names - not just their IDs - so the frontend
    can display them without extra round-trips.
    """
    return {
        "id": interaction.id,
        "hcp_id": interaction.hcp_id,
        "rep_id": interaction.rep_id,
        "date": interaction.date,
        "time": interaction.time,
        "interaction_type": interaction.interaction_type,
        "attendees": interaction.attendees or [],
        "topics_discussed": interaction.topics_discussed,
        "sentiment": interaction.sentiment.value if hasattr(interaction.sentiment, "value") else interaction.sentiment,
        "outcomes": interaction.outcomes,
        "follow_up_actions": interaction.follow_up_actions or [],
        "source": interaction.source.value if hasattr(interaction.source, "value") else interaction.source,
        "created_at": interaction.created_at,
        "updated_at": interaction.updated_at,
        "hcp": {"id": interaction.hcp.id, "name": interaction.hcp.name} if interaction.hcp else None,
        "materials": [
            {"id": im.material.id, "name": im.material.name, "type": im.material.type}
            for im in interaction.materials if im.material
        ],
        "samples": [
            {"id": isamp.sample.id, "name": isamp.sample.name, "product_line": isamp.sample.product_line}
            for isamp in interaction.samples if isamp.sample
        ],
    }


@router.get("/", response_model=List[InteractionOut])
def list_interactions(rep_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Interaction)
    if rep_id:
        query = query.filter(Interaction.rep_id == rep_id)
    interactions = query.order_by(Interaction.created_at.desc()).all()
    return [serialize_interaction(i) for i in interactions]


@router.get("/{interaction_id}", response_model=InteractionOut)
def get_interaction(interaction_id: str, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return serialize_interaction(interaction)


@router.post("/", response_model=InteractionOut)
def create_interaction(payload: InteractionCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"material_ids", "sample_ids"})
    interaction = Interaction(**data, source="form")
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    for material_id in payload.material_ids:
        db.add(InteractionMaterial(interaction_id=interaction.id, material_id=material_id))
    for sample_id in payload.sample_ids:
        db.add(InteractionSample(interaction_id=interaction.id, sample_id=sample_id))
    db.commit()
    db.refresh(interaction)

    return serialize_interaction(interaction)


@router.put("/{interaction_id}", response_model=InteractionOut)
def update_interaction(interaction_id: str, payload: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    updates = payload.model_dump(exclude_unset=True, exclude={"material_ids", "sample_ids"})
    for key, value in updates.items():
        setattr(interaction, key, value)
    interaction.updated_at = datetime.utcnow()

    if payload.material_ids is not None:
        db.query(InteractionMaterial).filter(InteractionMaterial.interaction_id == interaction.id).delete()
        for material_id in payload.material_ids:
            db.add(InteractionMaterial(interaction_id=interaction.id, material_id=material_id))

    if payload.sample_ids is not None:
        db.query(InteractionSample).filter(InteractionSample.interaction_id == interaction.id).delete()
        for sample_id in payload.sample_ids:
            db.add(InteractionSample(interaction_id=interaction.id, sample_id=sample_id))

    db.commit()
    db.refresh(interaction)
    return serialize_interaction(interaction)


@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: str, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"deleted": True}