from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict

from app.core.database import get_db
from app.features.auth.dependencies import require_role
from app.features.courses.models import Course
from app.features.courses.models_materials import LearningMaterial

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/admin", response_model=Dict[str, int])
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    """
    Returns global statistics for the admin dashboard.
    """
    total_courses = await db.scalar(select(func.count(Course.id)).where(Course.is_deleted == False))
    total_materials = await db.scalar(
        select(func.count(LearningMaterial.id))
        .where(LearningMaterial.is_deleted == False, LearningMaterial.type == "notes")
    )
    total_assignments = await db.scalar(
        select(func.count(LearningMaterial.id))
        .where(LearningMaterial.is_deleted == False, LearningMaterial.type == "assignment")
    )

    return {
        "courses": total_courses or 0,
        "materials": total_materials or 0,
        "assignments": total_assignments or 0,
    }

@router.get("/teacher", response_model=Dict[str, int])
async def get_teacher_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("teacher")),
):
    """
    Returns statistics relevant to the logged-in teacher.
    """
    from app.features.enrollments.models_teacher import TeacherCourse
    
    # Courses assigned to this teacher
    course_count = await db.scalar(
        select(func.count(Course.id))
        .join(TeacherCourse, TeacherCourse.course_id == Course.id)
        .where(TeacherCourse.teacher_id == current_user.id, Course.is_deleted == False)
    )
    
    # Materials created by this teacher
    material_count = await db.scalar(
        select(func.count(LearningMaterial.id))
        .where(LearningMaterial.created_by_teacher_id == current_user.id, LearningMaterial.is_deleted == False, LearningMaterial.type == "notes")
    )
    
    assignment_count = await db.scalar(
        select(func.count(LearningMaterial.id))
        .where(LearningMaterial.created_by_teacher_id == current_user.id, LearningMaterial.is_deleted == False, LearningMaterial.type == "assignment")
    )

    return {
        "courses": course_count or 0,
        "materials": material_count or 0,
        "assignments": assignment_count or 0,
    }

@router.get("/student", response_model=Dict[str, int])
async def get_student_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("student")),
):
    """
    Returns statistics relevant to the logged-in student.
    """
    from app.features.enrollments.models_student import StudentCourse
    from app.features.courses.models_assignment import Assignment
    from app.features.submissions.models import Submission
    
    # Courses this student is enrolled in
    course_count = await db.scalar(
        select(func.count(Course.id))
        .join(StudentCourse, StudentCourse.course_id == Course.id)
        .where(StudentCourse.student_id == current_user.id, Course.is_deleted == False)
    )
    
    # Total materials (notes) in enrolled courses
    material_count = await db.scalar(
        select(func.count(LearningMaterial.id))
        .join(StudentCourse, StudentCourse.course_id == LearningMaterial.course_id)
        .where(StudentCourse.student_id == current_user.id, LearningMaterial.is_deleted == False, LearningMaterial.type == "notes")
    )
    
    # Subquery for submission counts
    sub_count = (
        select(Submission.assignment_id, func.count(Submission.id).label("cnt"))
        .where(Submission.student_id == current_user.id)
        .group_by(Submission.assignment_id)
        .subquery()
    )

    # Main query for pending assignments (attempts left < max_attempts)
    pending_assignment_stmt = (
        select(func.count(LearningMaterial.id))
        .join(Assignment, Assignment.material_id == LearningMaterial.id)
        .join(StudentCourse, StudentCourse.course_id == LearningMaterial.course_id)
        .outerjoin(sub_count, sub_count.c.assignment_id == LearningMaterial.id)
        .where(
            StudentCourse.student_id == current_user.id,
            LearningMaterial.is_deleted == False,
            LearningMaterial.type == "assignment",
            func.coalesce(sub_count.c.cnt, 0) < Assignment.max_attempts
        )
    )
    pending_assignments = await db.scalar(pending_assignment_stmt) or 0

    return {
        "courses": course_count or 0,
        "materials": material_count or 0,
        "assignments": pending_assignments,
    }
