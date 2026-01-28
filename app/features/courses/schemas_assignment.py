from pydantic import BaseModel
from datetime import date
from enum import Enum

class AssignmentType(str, Enum):
    mcq = "mcq"
    long = "long"

class AssignmentCreate(BaseModel):
    assignment_type: AssignmentType
    total_marks: float
    due_date: date
    max_attempts: int = 1

class AssignmentRead(BaseModel):
    material_id: int
    assignment_type: AssignmentType
    total_marks: float
    due_date: date
    max_attempts: int

    class Config:
        from_attributes = True
