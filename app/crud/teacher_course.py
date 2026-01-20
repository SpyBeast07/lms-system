from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.models.teacher_course import TeacherCourse
from app.db.models.user import User
from app.db.models.course import Course


def assign_teacher_to_course(
    db: Session,
    teacher_id: int,
    course_id: int,
):
    # 1️⃣ Check teacher exists and is a teacher
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or teacher.role not in ("teacher", "principal"):
        raise ValueError("User is not a teacher")

    # 2️⃣ Check course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise ValueError("Course not found")

    # 3️⃣ Create mapping
    mapping = TeacherCourse(
        teacher_id=teacher_id,
        course_id=course_id,
    )

    db.add(mapping)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Teacher already assigned to this course")

    return mapping