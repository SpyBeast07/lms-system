from pydantic import BaseModel

class StudentCourseCreate(BaseModel):
    student_id: int
    course_id: int