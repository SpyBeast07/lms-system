from sqlalchemy import Integer, ForeignKey, Text, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db_base import Base

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

    selected_option_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("mcq_options.id")
    )

    marks_obtained: Mapped[float | None] = mapped_column(Numeric)
    
    student_assignment = relationship(
        "StudentAssignment", back_populates="answers"
    )
    question = relationship("Question")
    selected_option = relationship("MCQOption")