from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Student(Base):
    __tablename__ = "student"

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    roll_number: Mapped[int] = mapped_column(Integer, nullable=False)
    class_name: Mapped[str] = mapped_column("class", String, nullable=False)
    
    user = relationship("User", back_populates="student")