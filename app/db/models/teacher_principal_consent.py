from sqlalchemy import Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class TeacherPrincipalConsent(Base):
    __tablename__ = "teacher_principal_consent"
    __table_args__ = (
        UniqueConstraint("teacher_id", "principal_id"),
    )

    teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    principal_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    is_granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    
    teacher = relationship("User", foreign_keys=[teacher_id])
    principal = relationship("User", foreign_keys=[principal_id])