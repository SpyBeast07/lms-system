from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator
from datetime import date, datetime
from enum import Enum
from typing import List, Optional, Literal

class AssignmentType(str, Enum):
    FILE_UPLOAD = "FILE_UPLOAD"
    MCQ = "MCQ"
    TEXT = "TEXT"

class QuestionType(str, Enum):
    MCQ = "MCQ"
    TEXT = "TEXT"

class MCQOptionBase(BaseModel):
    option_text: str
    is_correct: bool

class MCQOptionCreate(MCQOptionBase):
    pass

class MCQOptionRead(BaseModel):
    id: int
    option_text: str
    # is_correct is hidden for students

    model_config = ConfigDict(from_attributes=True)

class MCQOptionTeacherRead(MCQOptionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    question_text: str
    question_type: QuestionType
    marks: float
    order_index: int = 0

class QuestionCreate(QuestionBase):
    options: Optional[List[MCQOptionCreate]] = None

    @model_validator(mode='after')
    def validate_mcq_options(self) -> 'QuestionCreate':
        if self.question_type == QuestionType.MCQ:
            if not self.options or len(self.options) == 0:
                raise ValueError("MCQ must have at least one option")
            if not any(o.is_correct for o in self.options):
                raise ValueError("MCQ must have at least one correct option")
        return self

class QuestionRead(QuestionBase):
    id: int
    options: List[MCQOptionRead] = []
    model_config = ConfigDict(from_attributes=True)

class QuestionTeacherRead(QuestionBase):
    id: int
    options: List[MCQOptionTeacherRead] = []
    model_config = ConfigDict(from_attributes=True)

class ReferenceMaterial(BaseModel):
    id: Optional[str] = None
    type: Literal["file", "link"]
    name: str
    url: str

class AssignmentCreate(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    assignment_type: AssignmentType
    total_marks: float
    due_date: date
    max_attempts: int = 1
    questions: Optional[List[QuestionCreate]] = None
    reference_materials: List[ReferenceMaterial] = Field(default_factory=list)

class AssignmentRead(BaseModel):
    material_id: int
    assignment_type: AssignmentType
    total_marks: float
    due_date: date
    max_attempts: int
    description: Optional[str] = None
    reference_materials: List[ReferenceMaterial] = Field(default_factory=list)
    questions: List[QuestionRead] = []

    model_config = ConfigDict(from_attributes=True)

class AssignmentTeacherRead(AssignmentRead):
    questions: List[QuestionTeacherRead] = []
    model_config = ConfigDict(from_attributes=True)

# --- Student Submission Schemas ---

class StudentAnswerSubmission(BaseModel):
    question_id: int
    selected_option_ids: List[int] = []
    answer_text: Optional[str] = None

class StudentAssignmentCreate(BaseModel):
    assignment_id: int
    answers: List[StudentAnswerSubmission]

class StudentAnswerRead(BaseModel):
    question_id: int
    answer_text: Optional[str] = None
    marks_obtained: Optional[float] = None
    question: Optional[QuestionRead] = None
    selected_options: List[MCQOptionRead] = []
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    def selected_option_ids(self) -> List[int]:
        return [o.id for o in getattr(self, "selected_options", [])]

class StudentAnswerTeacherRead(StudentAnswerRead):
    question: Optional[QuestionTeacherRead] = None
    model_config = ConfigDict(from_attributes=True)

class StudentAssignmentRead(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    attempt_number: int
    submitted_at: datetime
    total_marks: Optional[float] = None
    total_score: Optional[float] = None
    status: str
    answers: List[StudentAnswerRead] = []

    model_config = ConfigDict(from_attributes=True)

class StudentAssignmentTeacherRead(StudentAssignmentRead):
    answers: List[StudentAnswerTeacherRead] = []
    model_config = ConfigDict(from_attributes=True)
