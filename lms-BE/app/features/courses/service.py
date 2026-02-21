from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, UTC
from sqlalchemy import func

from app.features.courses.models import Course
from app.features.courses.schemas import CourseCreate, CourseUpdate

from app.features.enrollments.models_teacher import TeacherCourse
from app.features.enrollments.models_student import StudentCourse
from app.features.users.models import User

from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate

async def create_course(db: AsyncSession, course_in: CourseCreate) -> Course:
    course = Course(
        name=course_in.name,
        description=course_in.description,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    # We ideally need the user performing the action to accurately log it
    # Currently `create_course` does not receive `user_id`, so we will log loosely
    await log_action(db, ActivityLogCreate(
        action="create_course",
        entity_type="course",
        entity_id=course.id,
        details=f"Course '{course.name}' created"
    ))

    return course


async def get_courses(db: AsyncSession):
    result = await db.execute(
        select(Course).filter(Course.is_deleted == False)
    )
    return result.scalars().all()


from typing import Optional

async def get_courses_for_user(db: AsyncSession, user: User, page: int = 1, limit: int = 10, is_deleted: Optional[bool] = None):
    skip = (page - 1) * limit
    
    # Base query
    if user.role in ("super_admin", "principal"):
        query = select(Course)
        count_query = select(func.count(Course.id))
        
        if is_deleted is not None:
            query = query.filter(Course.is_deleted == is_deleted)
            count_query = count_query.filter(Course.is_deleted == is_deleted)
            
    elif user.role == "teacher":
        # Usually teachers only see active, but we'll follow is_deleted if passed
        deleted_filter = is_deleted if is_deleted is not None else False
        query = (
            select(Course)
            .join(TeacherCourse, TeacherCourse.course_id == Course.id)
            .filter(
                TeacherCourse.teacher_id == user.id,
                Course.is_deleted == deleted_filter,
            )
        )
        count_query = (
            select(func.count(Course.id))
            .join(TeacherCourse, TeacherCourse.course_id == Course.id)
            .filter(
                TeacherCourse.teacher_id == user.id,
                Course.is_deleted == deleted_filter,
            )
        )
    elif user.role == "student":
        # Usually students only see active
        deleted_filter = is_deleted if is_deleted is not None else False
        query = (
            select(Course)
            .join(StudentCourse, StudentCourse.course_id == Course.id)
            .filter(
                StudentCourse.student_id == user.id,
                Course.is_deleted == deleted_filter,
            )
        )
        count_query = (
            select(func.count(Course.id))
            .join(StudentCourse, StudentCourse.course_id == Course.id)
            .filter(
                StudentCourse.student_id == user.id,
                Course.is_deleted == deleted_filter,
            )
        )
    else:
        return {"items": [], "total": 0, "page": page, "limit": limit}

    # Execute queries
    result = await db.execute(query.offset(skip).limit(limit))
    items = result.scalars().all()
    
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

async def get_course(db: AsyncSession, course_id: int):
    result = await db.execute(
        select(Course).filter(
            Course.id == course_id,
            Course.is_deleted == False
        )
    )
    return result.scalars().first()

async def get_course_any(db: AsyncSession, course_id: int):
    result = await db.execute(
        select(Course).filter(Course.id == course_id)
    )
    return result.scalars().first()


async def update_course(db: AsyncSession, course: Course, data: CourseUpdate):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(course, field, value)

    course.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(course)
    return course


async def soft_delete_course(db: AsyncSession, course: Course):
    course.is_deleted = True
    course.updated_at = datetime.now(UTC)
    await db.commit()


async def restore_course(db: AsyncSession, course: Course):
    course.is_deleted = False
    course.updated_at = datetime.now(UTC)
    await db.commit()


async def hard_delete_course(db: AsyncSession, course: Course):
    await db.delete(course)
    await db.commit()