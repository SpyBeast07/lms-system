from sqlalchemy import Integer, Enum, Date, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Assignment(Base):
    __tablename__ = "assignments"

    material_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("learning_material.id", ondelete="CASCADE"),
        primary_key=True
    )

    assignment_type: Mapped[str] = mapped_column(
        Enum("mcq", "long", name="assignment_type"),
        nullable=False
    )

    total_marks: Mapped[float] = mapped_column(
        Numeric, nullable=False
    )

    due_date: Mapped[str] = mapped_column(Date, nullable=False)

    max_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    
    material = relationship("LearningMaterial", back_populates="assignment")
    questions = relationship("Question", back_populates="assignment")