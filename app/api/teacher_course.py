from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.teacher_course import TeacherCourseCreate
from app.crud.teacher_course import assign_teacher_to_course

router = APIRouter(prefix="/teacher-course", tags=["Teacher-Course"])


@router.post("/")
def assign_teacher(
    data: TeacherCourseCreate,
    db: Session = Depends(get_db),
):
    try:
        assign_teacher_to_course(
            db,
            teacher_id=data.teacher_id,
            course_id=data.course_id,
        )
        return {"message": "Teacher assigned to course successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))