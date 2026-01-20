from sqlalchemy import Integer, String, Enum, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class LearningMaterial(Base):
    __tablename__ = "learning_material"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("course.id", ondelete="CASCADE"),
        nullable=False
    )

    created_by_teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String, nullable=False
    )

    type: Mapped[str] = mapped_column(
        Enum("notes", "assignment", name="material_type"),
        nullable=False
    )

    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    course = relationship("Course", back_populates="learning_materials")
    creator = relationship("User")
    
    notes = relationship("Notes", uselist=False, back_populates="material")
    assignment = relationship("Assignment", uselist=False, back_populates="material")