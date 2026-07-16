from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db import get_db
from app.models import Material, Sample
from app.schemas.schemas import MaterialOut, SampleOut

router = APIRouter()


@router.get("/materials", response_model=List[MaterialOut])
def list_materials(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Material)
    if search:
        query = query.filter(Material.name.ilike(f"%{search}%"))
    return query.limit(20).all()


@router.get("/samples", response_model=List[SampleOut])
def list_samples(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Sample)
    if search:
        query = query.filter(Sample.name.ilike(f"%{search}%"))
    return query.limit(20).all()
