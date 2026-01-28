from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.features.courses.models import Course
from app.features.courses.schemas import CourseCreate, CourseUpdate

from app.features.enrollments.models_teacher import TeacherCourse
from app.features.enrollments.models_student import StudentCourse
from app.features.users.models import User

def create_course(db: Session, course_in: CourseCreate) -> Course:
    course = Course(
        name=course_in.name,
        description=course_in.description,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def get_courses(db: Session):
    return (
        db.query(Course)
        .filter(Course.is_deleted == False)
        .all()
    )


def get_courses_for_user(db: Session, user: User):
    # Admin & Principal → all courses
    if user.role in ("super_admin", "principal"):
        return (
            db.query(Course)
            .filter(Course.is_deleted == False)
            .all()
        )

    # Teacher → assigned courses
    if user.role == "teacher":
        return (
            db.query(Course)
            .join(TeacherCourse, TeacherCourse.course_id == Course.id)
            .filter(
                TeacherCourse.teacher_id == user.id,
                Course.is_deleted == False,
            )
            .all()
        )

    # Student → enrolled courses
    if user.role == "student":
        return (
            db.query(Course)
            .join(StudentCourse, StudentCourse.course_id == Course.id)
            .filter(
                StudentCourse.student_id == user.id,
                Course.is_deleted == False,
            )
            .all()
        )

    return []

def get_course(db: Session, course_id: int):
    return (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.is_deleted == False
        )
        .first()
    )

def get_course_any(db: Session, course_id: int):
    return db.query(Course).filter(Course.id == course_id).first()


def update_course(db: Session, course: Course, data: CourseUpdate):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(course, field, value)

    course.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(course)
    return course


def soft_delete_course(db: Session, course: Course):
    course.is_deleted = True
    course.updated_at = datetime.now(UTC)
    db.commit()


def restore_course(db: Session, course: Course):
    course.is_deleted = False
    course.updated_at = datetime.now(UTC)
    db.commit()


def hard_delete_course(db: Session, course: Course):
    db.delete(course)
    db.commit()