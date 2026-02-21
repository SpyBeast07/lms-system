from sqlalchemy import Integer, String, Text, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.core.db_base import Base

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # E.g., 'assignment_posted', 'assignment_graded', 'course_enrollment', 'material_uploaded'
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )

    user = relationship("User")
