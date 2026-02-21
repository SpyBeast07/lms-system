from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from app.features.enrollments.models_teacher import TeacherCourse
from app.features.users.models import User
from app.features.courses.models import Course
from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate
from app.features.notifications.service import create_notification
from app.features.notifications.schemas import NotificationCreate


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

    # Capture names before commit expires the ORM objects
    teacher_name = teacher.name
    course_name = course.name

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Teacher already assigned to this course")

    await log_action(db, ActivityLogCreate(
        user_id=teacher_id,
        action="teacher_assigned_to_course",
        entity_type="enrollment",
        entity_id=course_id,
        details=f"Teacher '{teacher_name}' assigned to course '{course_name}'"
    ))

    await create_notification(db, NotificationCreate(
        user_id=teacher_id,
        type="teacher_assignment",
        message=f"You have been assigned to teach the course: {course_name}",
        entity_id=course_id
    ))

    return mapping

async def get_all_teacher_assignments(db: AsyncSession):
    result = await db.execute(
        select(TeacherCourse, User.name.label("teacher_name"), Course.name.label("course_name"))
        .join(User, User.id == TeacherCourse.teacher_id)
        .join(Course, Course.id == TeacherCourse.course_id)
        .filter(User.is_deleted != True, Course.is_deleted != True)
    )
    
    assignments = []
    for row in result.all():
        tc = row[0]
        assignments.append({
            "teacher_id": tc.teacher_id,
            "course_id": tc.course_id,
            "teacher_name": row[1],
            "course_name": row[2]
        })
    return assignments