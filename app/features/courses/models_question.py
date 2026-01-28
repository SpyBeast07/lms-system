from sqlalchemy import Integer, Text, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db_base import Base

class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    assignment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("assignments.material_id", ondelete="CASCADE"),
        nullable=False
    )

    question_text: Mapped[str] = mapped_column(Text, nullable=False)

    question_type: Mapped[str] = mapped_column(
        Enum("mcq", "long", name="question_type"),
        nullable=False
    )

    marks: Mapped[float] = mapped_column(Numeric, nullable=False)
    
    assignment = relationship("Assignment", back_populates="questions")
    options = relationship("MCQOption", back_populates="question")