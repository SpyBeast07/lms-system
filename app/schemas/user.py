from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    super_admin = "super_admin"
    principal = "principal"
    teacher = "teacher"
    student = "student"
    
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole

class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
