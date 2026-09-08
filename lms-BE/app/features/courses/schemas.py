from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CourseCreate(BaseModel):
    name: str
    description: str = ""


class CourseRead(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
