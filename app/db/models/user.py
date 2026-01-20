from sqlalchemy import Integer, String, Enum, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    name: Mapped[str] = mapped_column(String, nullable=False)

    email: Mapped[str] = mapped_column(
        String, nullable=False, unique=True
    )

    password_hash: Mapped[str] = mapped_column(
        String, nullable=False
    )

    role: Mapped[str] = mapped_column(
        Enum("super_admin", "principal", "teacher", "student", name="user_roles"),
        nullable=False
    )

    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    teacher = relationship(
        "Teacher",
        back_populates="user",
        uselist=False
    )
    
    student = relationship(
        "Student",
        back_populates="user",
        uselist=False
    )