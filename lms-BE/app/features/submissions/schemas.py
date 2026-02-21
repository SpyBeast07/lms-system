from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from typing import Optional

class StudentInfo(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    assignment_id: int
    file_url: str
    object_name: Optional[str] = None
    comments: Optional[str] = None

class SubmissionGrade(BaseModel):
    grade: float = Field(ge=0)
    feedback: Optional[str] = None

class SubmissionRead(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    file_url: str
    comments: Optional[str] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None
    student: Optional[StudentInfo] = None

    class Config:
        from_attributes = True

class PaginatedSubmissions(BaseModel):
    total_count: int
    results: list[SubmissionRead]
