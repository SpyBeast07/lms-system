from sqlalchemy import Integer, Boolean, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class MCQOption(Base):
    __tablename__ = "mcq_options"
    __table_args__ = (
        UniqueConstraint("question_id", "option_text"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False
    )

    option_text: Mapped[str] = mapped_column(String, nullable=False)

    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    
    question = relationship("Question", back_populates="options")