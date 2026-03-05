from sqlalchemy import Integer, Enum, Date, Numeric, ForeignKey, Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db_base import Base

class Assignment(Base):
    __tablename__ = "assignments"

    material_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("learning_material.id", ondelete="CASCADE"),
        primary_key=True
    )

    assignment_type: Mapped[str] = mapped_column(
        Enum("FILE_UPLOAD", "MCQ", "TEXT", name="assignment_type"),
        nullable=False,
        default="FILE_UPLOAD"
    )

    total_marks: Mapped[float] = mapped_column(
        Numeric, nullable=False, default=0
    )

    due_date: Mapped[str] = mapped_column(Date, nullable=False)

    max_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    reference_material_url: Mapped[str | None] = mapped_column(String, nullable=True)
    reference_material_name: Mapped[str | None] = mapped_column(String, nullable=True)
    
    material = relationship("LearningMaterial", back_populates="assignment")
    questions = relationship("Question", back_populates="assignment")