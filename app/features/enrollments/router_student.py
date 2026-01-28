from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.enrollments.schemas_student import StudentCourseCreate
from app.features.enrollments.service_student import enroll_student_in_course
from app.features.auth.dependencies import require_role

router = APIRouter(prefix="/student-course", tags=["Student-Course"])


@router.post("/")
def enroll_student(
    data: StudentCourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    enroll_student_in_course(
        db,
        student_id=data.student_id,
        course_id=data.course_id,
    )
    return {"message": "Student enrolled in course successfully"}