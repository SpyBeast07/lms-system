from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class MaterialType(str, Enum):
    notes = "notes"
    assignment = "assignment"

class LearningMaterialCreate(BaseModel):
    course_id: int
    title: str
    type: MaterialType

class LearningMaterialRead(BaseModel):
    id: int
    course_id: int
    created_by_teacher_id: int
    title: str
    type: MaterialType
    created_at: datetime

    class Config:
        from_attributes = True
