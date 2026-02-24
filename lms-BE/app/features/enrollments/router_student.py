from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.enrollments.schemas_student import StudentCourseCreate
from app.features.enrollments.service_student import enroll_student_in_course, get_all_student_enrollments
from app.features.auth.dependencies import require_role

router = APIRouter(prefix="/student-course", tags=["Student-Course"])


@router.post("/")
async def enroll_student(
    data: StudentCourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    await enroll_student_in_course(
        db,
        student_id=data.student_id,
        course_id=data.course_id,
    )
    return {"message": "Student enrolled in course successfully"}

@router.get("/")
async def list_student_enrollments(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    return await get_all_student_enrollments(db)