from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from app.features.enrollments.models_student import StudentCourse
from app.features.users.models import User
from app.features.courses.models import Course
from app.features.notifications.service import create_notification
from app.features.notifications.schemas import NotificationCreate
from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate


async def enroll_student_in_course(
    db: AsyncSession,
    student_id: int,
    course_id: int,
    school_id: Optional[int] = None
):
    # 1️⃣ Check student exists and role is student
    result = await db.execute(select(User).filter(User.id == student_id))
    student = result.scalars().first()
    if not student or student.role != "student":
        raise ValueError("User is not a student")

    if school_id and student.school_id != school_id:
        raise ValueError("Student does not belong to your school")

    # 2️⃣ Check course exists
    result = await db.execute(select(Course).filter(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise ValueError("Course not found")
        
    if school_id and course.school_id != school_id:
        raise ValueError("Course does not belong to your school")

    # 3️⃣ Create enrollment
    enrollment = StudentCourse(
        student_id=student_id,
        course_id=course_id,
        school_id=course.school_id
    )

    db.add(enrollment)

    # Capture names before commit expires the ORM objects
    student_name = student.name
    course_name = course.name

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Student already enrolled in this course")

    await log_action(db, ActivityLogCreate(
        user_id=student_id,
        action="course_enrolled",
        entity_type="enrollment",
        entity_id=course_id,
        details=f"Student {student_name} enrolled in course '{course_name}'"
    ), school_id=course.school_id)
    
    await create_notification(db, NotificationCreate(
        user_id=student_id,
        type="course_enrollment",
        message=f"You have been enrolled in a new course: {course_name}",
        entity_id=course_id
    ), school_id=course.school_id)

    return enrollment

async def get_all_student_enrollments(db: AsyncSession, school_id: Optional[int] = None):
    query = (
        select(StudentCourse, User.name.label("student_name"), Course.name.label("course_name"))
        .join(User, User.id == StudentCourse.student_id)
        .join(Course, Course.id == StudentCourse.course_id)
        .filter(User.is_deleted != True, Course.is_deleted != True)
    )
    
    if school_id:
        query = query.filter(StudentCourse.school_id == school_id)

    result = await db.execute(query)
    
    enrollments = []
    for row in result.all():
        sc = row[0]
        enrollments.append({
            "student_id": sc.student_id,
            "course_id": sc.course_id,
            "student_name": row[1],
            "course_name": row[2]
        })
    return enrollments