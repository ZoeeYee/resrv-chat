from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None  # Firebase 註冊時不需要密碼
    firebase_uid: Optional[str] = None  # Firebase UID

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    firebase_uid: Optional[str] = None
    class Config:
        from_attributes = True 

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
