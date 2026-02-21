from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationCreate(BaseModel):
    user_id: int
    type: str
    message: str

class NotificationRead(BaseModel):
    id: int
    user_id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
