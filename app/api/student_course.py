from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.student_course import StudentCourseCreate
from app.crud.student_course import enroll_student_in_course

router = APIRouter(prefix="/student-course", tags=["Student-Course"])


@router.post("/")
def enroll_student(
    data: StudentCourseCreate,
    db: Session = Depends(get_db),
):
    try:
        enroll_student_in_course(
            db,
            student_id=data.student_id,
            course_id=data.course_id,
        )
        return {"message": "Student enrolled in course successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))