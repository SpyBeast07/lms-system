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

async def create_course(db: AsyncSession, course_in: CourseCreate, school_id: int) -> Course:
    course = Course(
        name=course_in.name,
        description=course_in.description,
        school_id=school_id
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    await log_action(db, ActivityLogCreate(
        action="create_course",
        entity_type="course",
        entity_id=course.id,
        details=f"Course '{course.name}' created for school {school_id}"
    ), school_id=school_id)

    return course

async def get_courses(db: AsyncSession, school_id: Optional[int] = None):
    query = select(Course).filter(Course.is_deleted == False)
    if school_id:
        query = query.filter(Course.school_id == school_id)
    result = await db.execute(query)
    return result.scalars().all()

async def get_courses_for_user(db: AsyncSession, user: User, page: int = 1, limit: int = 10, is_deleted: Optional[bool] = None):
    skip = (page - 1) * limit
    
    # Base query
    query = select(Course)
    count_query = select(func.count(Course.id))
    
    # Super Admin bypasses school filter
    if user.role != "super_admin":
        query = query.filter(Course.school_id == user.school_id)
        count_query = count_query.filter(Course.school_id == user.school_id)

    if user.role in ("super_admin", "principal"):
        if is_deleted is not None:
            query = query.filter(Course.is_deleted == is_deleted)
            count_query = count_query.filter(Course.is_deleted == is_deleted)
            
    elif user.role == "teacher":
        deleted_filter = is_deleted if is_deleted is not None else False
        query = (
            query
            .join(TeacherCourse, TeacherCourse.course_id == Course.id)
            .filter(
                TeacherCourse.teacher_id == user.id,
                Course.is_deleted == deleted_filter,
            )
        )
        count_query = (
            count_query
            .join(TeacherCourse, TeacherCourse.course_id == Course.id)
            .filter(
                TeacherCourse.teacher_id == user.id,
                Course.is_deleted == deleted_filter,
            )
        )
    elif user.role == "student":
        deleted_filter = is_deleted if is_deleted is not None else False
        query = (
            query
            .join(StudentCourse, StudentCourse.course_id == Course.id)
            .filter(
                StudentCourse.student_id == user.id,
                Course.is_deleted == deleted_filter,
            )
        )
        count_query = (
            count_query
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

async def get_course(db: AsyncSession, course_id: int, school_id: Optional[int] = None):
    query = select(Course).filter(
        Course.id == course_id,
        Course.is_deleted == False
    )
    if school_id:
        query = query.filter(Course.school_id == school_id)
    result = await db.execute(query)
    return result.scalars().first()

async def get_course_any(db: AsyncSession, course_id: int, school_id: Optional[int] = None):
    query = select(Course).filter(Course.id == course_id)
    if school_id:
        query = query.filter(Course.school_id == school_id)
    result = await db.execute(query)
    return result.scalars().first()


async def update_course(db: AsyncSession, course: Course, data: CourseUpdate):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(course, field, value)

    course.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(course)
    return course


async def soft_delete_course(db: AsyncSession, course: Course):
    cid, cname, cschool = course.id, course.name, course.school_id  # capture before commit expires them
    course.is_deleted = True
    course.updated_at = datetime.now(UTC)
    await db.commit()

    await log_action(db, ActivityLogCreate(
        action="course_deleted",
        entity_type="course",
        entity_id=cid,
        details=f"Course '{cname}' soft-deleted"
    ), school_id=cschool)


async def restore_course(db: AsyncSession, course: Course):
    cid, cname, cschool = course.id, course.name, course.school_id  # capture before commit expires them
    course.is_deleted = False
    course.updated_at = datetime.now(UTC)
    await db.commit()

    await log_action(db, ActivityLogCreate(
        action="course_restored",
        entity_type="course",
        entity_id=cid,
        details=f"Course '{cname}' restored"
    ), school_id=cschool)


async def hard_delete_course(db: AsyncSession, course: Course):
    await db.delete(course)
    await db.commit()