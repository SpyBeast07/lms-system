from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserLogInfo(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class ActivityLogCreate(BaseModel):
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None

class ActivityLogRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime
    
    user: Optional[UserLogInfo] = None

    class Config:
        from_attributes = True

class PaginatedActivityLogs(BaseModel):
    items: list[ActivityLogRead]
    total: int
    page: int
    size: int
    pages: int
