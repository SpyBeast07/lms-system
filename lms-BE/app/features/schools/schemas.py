from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class SchoolBase(BaseModel):
    name: str
    subscription_end: datetime
    max_teachers: int = 10

class PrincipalInfo(BaseModel):
    id: int
    name: str
    email: str

class SchoolCreate(SchoolBase):
    subscription_start: Optional[datetime] = None

class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    subscription_end: Optional[datetime] = None
    max_teachers: Optional[int] = None

class SchoolRead(SchoolBase):
    id: int
    subscription_start: datetime
    created_at: datetime
    updated_at: datetime
    principal: Optional[PrincipalInfo] = None

    model_config = ConfigDict(from_attributes=True)

class SchoolPagination(BaseModel):
    items: list[SchoolRead]
    total: int
    page: int
    size: int
    pages: int

class AssignPrincipal(BaseModel):
    user_id: int
