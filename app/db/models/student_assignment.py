from sqlalchemy import Integer, Enum, TIMESTAMP, Numeric, ForeignKey, UniqueConstraint, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime, UTC

from app.db.base import Base

class StudentAssignment(Base):
    __tablename__ = "student_assignments"
    __table_args__ = (
        UniqueConstraint("student_id", "assignment_id", "attempt_number"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.material_id", ondelete="CASCADE"),
        nullable=False
    )

    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)

    submitted_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

    total_score: Mapped[float | None] = mapped_column(Numeric)

    status: Mapped[str] = mapped_column(
        Enum("submitted", "evaluated", name="assignment_status"),
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

    student = relationship("User")
    assignment = relationship("Assignment")
    answers = relationship(
        "StudentAnswer",
        back_populates="student_assignment"
    )