from sqlalchemy import Integer, String, Text, TIMESTAMP, func, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.db_base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.features.schools.models import School

class Course(Base):
    __tablename__ = "course"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    name: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[str] = mapped_column(Text, nullable=False)

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
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

    school = relationship("School", back_populates="courses")
    learning_materials = relationship(
        "LearningMaterial",
        back_populates="course",
        cascade="all, delete-orphan"
    )