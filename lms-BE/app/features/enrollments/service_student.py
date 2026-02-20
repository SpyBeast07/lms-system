from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from app.features.enrollments.models_student import StudentCourse
from app.features.users.models import User
from app.features.courses.models import Course


async def enroll_student_in_course(
    db: AsyncSession,
    student_id: int,
    course_id: int,
):
    # 1️⃣ Check student exists and role is student
    result = await db.execute(select(User).filter(User.id == student_id))
    student = result.scalars().first()
    if not student or student.role != "student":
        raise ValueError("User is not a student")

    # 2️⃣ Check course exists
    result = await db.execute(select(Course).filter(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise ValueError("Course not found")

    # 3️⃣ Create enrollment
    enrollment = StudentCourse(
        student_id=student_id,
        course_id=course_id,
    )

    db.add(enrollment)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Student already enrolled in this course")

    return enrollment

async def get_all_student_enrollments(db: AsyncSession):
    result = await db.execute(
        select(StudentCourse, User.name.label("student_name"), Course.name.label("course_name"))
        .join(User, User.id == StudentCourse.student_id)
        .join(Course, Course.id == StudentCourse.course_id)
        .filter(User.is_deleted != True, Course.is_deleted != True)
    )
    
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