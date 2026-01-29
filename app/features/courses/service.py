from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, UTC

from app.features.courses.models import Course
from app.features.courses.schemas import CourseCreate, CourseUpdate

from app.features.enrollments.models_teacher import TeacherCourse
from app.features.enrollments.models_student import StudentCourse
from app.features.users.models import User

async def create_course(db: AsyncSession, course_in: CourseCreate) -> Course:
    course = Course(
        name=course_in.name,
        description=course_in.description,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def get_courses(db: AsyncSession):
    result = await db.execute(
        select(Course).filter(Course.is_deleted == False)
    )
    return result.scalars().all()


async def get_courses_for_user(db: AsyncSession, user: User):
    # Admin & Principal → all courses
    if user.role in ("super_admin", "principal"):
        result = await db.execute(
            select(Course).filter(Course.is_deleted == False)
        )
        return result.scalars().all()

    # Teacher → assigned courses
    if user.role == "teacher":
        result = await db.execute(
            select(Course)
            .join(TeacherCourse, TeacherCourse.course_id == Course.id)
            .filter(
                TeacherCourse.teacher_id == user.id,
                Course.is_deleted == False,
            )
        )
        return result.scalars().all()

    # Student → enrolled courses
    if user.role == "student":
        result = await db.execute(
            select(Course)
            .join(StudentCourse, StudentCourse.course_id == Course.id)
            .filter(
                StudentCourse.student_id == user.id,
                Course.is_deleted == False,
            )
        )
        return result.scalars().all()

    return []

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