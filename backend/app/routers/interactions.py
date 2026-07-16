from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db import get_db
from app.models import Interaction, InteractionMaterial, InteractionSample
from app.schemas.schemas import InteractionCreate, InteractionUpdate, InteractionOut

router = APIRouter()


@router.get("/", response_model=List[InteractionOut])
def list_interactions(rep_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Interaction)
    if rep_id:
        query = query.filter(Interaction.rep_id == rep_id)
    return query.order_by(Interaction.created_at.desc()).all()


@router.get("/{interaction_id}", response_model=InteractionOut)
def get_interaction(interaction_id: str, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


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

    return interaction


@router.put("/{interaction_id}", response_model=InteractionOut)
def update_interaction(interaction_id: str, payload: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(interaction, key, value)
    interaction.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: str, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"deleted": True}
