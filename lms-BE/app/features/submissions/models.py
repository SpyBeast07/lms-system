from sqlalchemy import Integer, String, Text, Numeric, ForeignKey, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.core.db_base import Base

class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("assignments.material_id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    object_name: Mapped[str | None] = mapped_column(String, nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    submitted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    graded_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    assignment = relationship("Assignment")
    student = relationship("User")
