from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.enrollments.schemas_teacher import TeacherCourseCreate
from app.features.enrollments.service_teacher import assign_teacher_to_course, get_all_teacher_assignments
from app.features.auth.dependencies import require_role

router = APIRouter(prefix="/teacher-course", tags=["Teacher-Course"])


@router.post("/")
async def assign_teacher(
    data: TeacherCourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("principal")),
):
    await assign_teacher_to_course(
        db,
        teacher_id=data.teacher_id,
        course_id=data.course_id,
        school_id=current_user.school_id,
    )
    return {"message": "Teacher assigned to course successfully"}

@router.get("/")
async def list_teacher_assignments(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("principal")),
):
    return await get_all_teacher_assignments(db, school_id=current_user.school_id)