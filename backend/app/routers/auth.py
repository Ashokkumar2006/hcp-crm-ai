from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from pydantic import BaseModel

from app.db import get_db
from app.models import User
from app.auth import create_access_token

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    rep_id: str
    name: str
    token: str


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not bcrypt.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(rep_id=user.id, name=user.name)
    return LoginResponse(rep_id=user.id, name=user.name, token=token)
