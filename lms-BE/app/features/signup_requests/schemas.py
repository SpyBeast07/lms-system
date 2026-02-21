from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


class SignupRequestCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    requested_role: Literal["student", "teacher"]


class SignupRequestRead(BaseModel):
    id: int
    name: str
    email: str
    requested_role: str
    approved_role: Optional[str] = None
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SignupApprovalRequest(BaseModel):
    """Optional role override on approval. If omitted, uses requested_role."""
    approved_role: Optional[Literal["student", "teacher"]] = None


class PaginatedSignupRequests(BaseModel):
    items: list[SignupRequestRead]
    total: int
    page: int
    size: int
    pages: int
