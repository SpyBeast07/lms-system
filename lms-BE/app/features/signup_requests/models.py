from sqlalchemy import Integer, String, Enum, TIMESTAMP, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.db_base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.features.schools.models import School

class SignupRequest(Base):
    __tablename__ = "signup_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False)

    email: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)

    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    school_id: Mapped[int | None] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"), nullable=True, index=True
    )

    requested_role: Mapped[str] = mapped_column(
        Enum("student", "teacher", "principal", name="signup_requested_role"),
        nullable=False,
    )

    approved_role: Mapped[str | None] = mapped_column(
        Enum("student", "teacher", "principal", name="signup_approved_role"),
        nullable=True,
        default=None,
    )

    status: Mapped[str] = mapped_column(
        Enum("pending", "approved", "rejected", name="signup_status"),
        nullable=False,
        default="pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    school = relationship("School")
