from pydantic import BaseModel
from datetime import datetime, date
from enum import Enum
from typing import Optional

class MaterialType(str, Enum):
    notes = "notes"
    assignment = "assignment"

class BaseMaterialCreate(BaseModel):
    course_id: int
    title: str

class NotesCreate(BaseMaterialCreate):
    content_url: str

from app.features.courses.schemas_assignment import AssignmentCreate

class LearningMaterialRead(BaseModel):
    id: int
    course_id: int
    created_by_teacher_id: int
    title: str
    type: MaterialType
    created_at: datetime

    class Config:
        from_attributes = True

class LearningMaterialUpdate(BaseModel):
    title: Optional[str] = None