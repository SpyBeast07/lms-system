from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


class SignupRequestCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    requested_role: Literal["student", "teacher", "principal"]
    school_id: Optional[int] = None


class SignupRequestRead(BaseModel):
    id: int
    name: str
    email: str
    requested_role: str
    approved_role: Optional[str] = None
    status: str
    school_id: Optional[int] = None
    school_name: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SignupApprovalRequest(BaseModel):
    """Optional role override on approval. If omitted, uses requested_role."""
    approved_role: Optional[Literal["student", "teacher", "principal"]] = None


class PaginatedSignupRequests(BaseModel):
    items: list[SignupRequestRead]
    total: int
    page: int
    size: int
    pages: int
