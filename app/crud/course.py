from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.db.models.course import Course
from app.schemas.course import CourseCreate


def create_course(db: Session, course_in: CourseCreate) -> Course:
    course = Course(
        name=course_in.name,
        description=course_in.description,
        created_at=datetime.now(UTC),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def get_courses(db: Session) -> list[Course]:
    return db.query(Course).all()