from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from app.features.enrollments.models_teacher import TeacherCourse
from app.features.users.models import User
from app.features.courses.models import Course


async def assign_teacher_to_course(
    db: AsyncSession,
    teacher_id: int,
    course_id: int,
):
    # 1️⃣ Check teacher exists and is a teacher
    result = await db.execute(select(User).filter(User.id == teacher_id))
    teacher = result.scalars().first()
    if not teacher or teacher.role not in ("teacher", "principal"):
        raise ValueError("User is not a teacher")

    # 2️⃣ Check course exists
    result = await db.execute(select(Course).filter(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise ValueError("Course not found")

    # 3️⃣ Create mapping
    mapping = TeacherCourse(
        teacher_id=teacher_id,
        course_id=course_id,
    )

    db.add(mapping)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Teacher already assigned to this course")

    return mapping