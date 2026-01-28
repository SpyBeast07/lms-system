from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db_base import Base

class TeacherCourse(Base):
    __tablename__ = "teacher_course"
    __table_args__ = (
        UniqueConstraint("teacher_id", "course_id"),
    )

    teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course.id", ondelete="CASCADE"),
        primary_key=True
    )