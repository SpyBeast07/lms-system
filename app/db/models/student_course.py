from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class StudentCourse(Base):
    __tablename__ = "student_course"
    __table_args__ = (
        UniqueConstraint("student_id", "course_id"),
    )

    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course.id", ondelete="CASCADE"),
        primary_key=True
    )