from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db_base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.features.schools.models import School

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

    school_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("schools.id"),
        nullable=False,
        index=True
    )

    school = relationship("School", back_populates="enrollments_teacher")