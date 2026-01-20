from sqlalchemy import Integer, String, Text, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Course(Base):
    __tablename__ = "course"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        String, nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    learning_materials = relationship(
        "LearningMaterial",
        back_populates="course",
        cascade="all, delete-orphan"
    )