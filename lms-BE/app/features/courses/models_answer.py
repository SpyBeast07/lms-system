from sqlalchemy import Integer, ForeignKey, Text, Numeric, UniqueConstraint, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.core.db_base import Base

student_answer_options = Table(
    "student_answer_options",
    Base.metadata,
    Column("student_answer_id", Integer, ForeignKey("student_answers.id", ondelete="CASCADE"), primary_key=True),
    Column("mcq_option_id", Integer, ForeignKey("mcq_options.id", ondelete="CASCADE"), primary_key=True),
)

class StudentAnswer(Base):
    __tablename__ = "student_answers"
    __table_args__ = (
        UniqueConstraint("student_assignment_id", "question_id"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    student_assignment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("student_assignments.id", ondelete="CASCADE"),
        nullable=False
    )

    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False
    )

    answer_text: Mapped[str | None] = mapped_column(Text)

    marks_obtained: Mapped[float | None] = mapped_column(Numeric)
    
    student_assignment = relationship(
        "StudentAssignment", back_populates="answers"
    )
    question = relationship("Question")
    selected_options = relationship("MCQOption", secondary=student_answer_options)