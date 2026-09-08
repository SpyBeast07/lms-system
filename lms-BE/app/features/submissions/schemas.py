from pydantic import BaseModel, HttpUrl, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

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
    submission_type: str = "FILE_UPLOAD" # Default to handle old API calls
    grade: float = Field(ge=0)
    feedback: Optional[str] = None

class SubmissionRead(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    file_url: Optional[str] = None
    comments: Optional[str] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None
    student: Optional[StudentInfo] = None

    class Config:
        from_attributes = True

class UnifiedSubmissionRead(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    submission_type: str # "FILE_UPLOAD", "MCQ", "TEXT"
    title: Optional[str] = None
    submitted_at: datetime
    status: str
    
    # For File Uploads
    file_url: Optional[str] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    
    # For Assessments (MCQ/TEXT)
    total_score: Optional[float] = None
    total_marks: Optional[float] = None
    attempt_number: Optional[int] = None
    
    student: Optional[StudentInfo] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedSubmissions(BaseModel):
    total_count: int
    results: List[UnifiedSubmissionRead]
