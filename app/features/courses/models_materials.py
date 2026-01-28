from sqlalchemy import Integer, String, Enum, ForeignKey, TIMESTAMP, func, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC

from app.core.db_base import Base

class LearningMaterial(Base):
    __tablename__ = "learning_material"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("course.id", ondelete="CASCADE"),
        nullable=False
    )

    created_by_teacher_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(String, nullable=False)

    type: Mapped[str] = mapped_column(
        Enum("notes", "assignment", name="material_type"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    course = relationship("Course", back_populates="learning_materials")

    creator = relationship(
        "User",
        foreign_keys=[created_by_teacher_id]
    )

    notes = relationship("Notes", uselist=False, back_populates="material")
    assignment = relationship("Assignment", uselist=False, back_populates="material")