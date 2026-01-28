from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.features.enrollments.models_student import StudentCourse
from app.features.users.models import User
from app.features.courses.models import Course


def enroll_student_in_course(
    db: Session,
    student_id: int,
    course_id: int,
):
    # 1️⃣ Check student exists and role is student
    student = db.query(User).filter(User.id == student_id).first()
    if not student or student.role != "student":
        raise ValueError("User is not a student")

    # 2️⃣ Check course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise ValueError("Course not found")

    # 3️⃣ Create enrollment
    enrollment = StudentCourse(
        student_id=student_id,
        course_id=course_id,
    )

    db.add(enrollment)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Student already enrolled in this course")

    return enrollment