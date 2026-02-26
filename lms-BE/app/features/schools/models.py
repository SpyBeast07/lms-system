from sqlalchemy import Integer, String, TIMESTAMP, func, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.db_base import Base

class School(Base):
    __tablename__ = "schools"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    
    subscription_start: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    subscription_end: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False
    )
    
    max_teachers: Mapped[int] = mapped_column(Integer, default=10, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    users = relationship("User", back_populates="school")
    courses = relationship("Course", back_populates="school")
    materials = relationship("LearningMaterial", back_populates="school")
    submissions = relationship("Submission", back_populates="school")
    enrollments_teacher = relationship("TeacherCourse", back_populates="school")
    enrollments_student = relationship("StudentCourse", back_populates="school")
