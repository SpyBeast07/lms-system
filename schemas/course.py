from pydantic import BaseModel
from datetime import datetime

class CourseCreate(BaseModel):
    name: str
    description: str

class CourseRead(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

class CourseRead(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True
