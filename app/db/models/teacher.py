from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base 

class Teacher(Base):
    __tablename__ = "teacher"

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    department: Mapped[str | None] = mapped_column(String)
    designation: Mapped[str | None] = mapped_column(String)

    user = relationship("User", back_populates="teacher")