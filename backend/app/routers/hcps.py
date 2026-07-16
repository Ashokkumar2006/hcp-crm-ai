from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List

from app.db import get_db
from app.models import HCP
from app.schemas.schemas import HCPOut, HCPCreate

router = APIRouter()


@router.get("/", response_model=List[HCPOut])
def list_hcps(search: Optional[str] = None, db: Session = Depends(get_db)):
    """Powers the 'Search or select HCP...' field in the Log Interaction form."""
    query = db.query(HCP)
    if search:
        query = query.filter(
            or_(HCP.name.ilike(f"%{search}%"), HCP.hospital_or_clinic.ilike(f"%{search}%"))
        )
    return query.limit(20).all()


@router.get("/{hcp_id}", response_model=HCPOut)
def get_hcp(hcp_id: str, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return hcp


@router.post("/", response_model=HCPOut)
def create_hcp(payload: HCPCreate, db: Session = Depends(get_db)):
    hcp = HCP(**payload.model_dump())
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp
