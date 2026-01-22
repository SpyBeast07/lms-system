from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.teacher_course import TeacherCourseCreate
from app.crud.teacher_course import assign_teacher_to_course
from app.auth.dependencies import require_role

router = APIRouter(prefix="/teacher-course", tags=["Teacher-Course"])


@router.post("/")
def assign_teacher(
    data: TeacherCourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    assign_teacher_to_course(
        db,
        teacher_id=data.teacher_id,
        course_id=data.course_id,
    )
    return {"message": "Teacher assigned to course successfully"}