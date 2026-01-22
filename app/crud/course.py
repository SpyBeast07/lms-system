from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.db.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate


def create_course(db: Session, course_in: CourseCreate) -> Course:
    course = Course(
        name=course_in.name,
        description=course_in.description,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def list_courses(db: Session):
    return (
        db.query(Course)
        .filter(Course.is_deleted == False)
        .all()
    )


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