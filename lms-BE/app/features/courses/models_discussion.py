from sqlalchemy import Integer, String, Text, Enum, ForeignKey, TIMESTAMP, func, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.db_base import Base
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from app.features.schools.models import School
    from app.features.courses.models import Course
    from app.features.users.models import User

class CoursePost(Base):
    __tablename__ = "course_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("course.id", ondelete="CASCADE"), nullable=False, index=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        Enum('ANNOUNCEMENT', 'DISCUSSION', 'QUESTION', name='post_type'),
        nullable=False,
        default='DISCUSSION'
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    course = relationship("Course")
    school = relationship("School")
    author = relationship("User")
    replies = relationship("PostReply", back_populates="post", cascade="all, delete-orphan")

    @property
    def author_name(self) -> Optional[str]:
        return self.author.name if self.author else None

class PostReply(Base):
    __tablename__ = "post_replies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("course_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_reply_id: Mapped[Optional[int]] = mapped_column(ForeignKey("post_replies.id", ondelete="CASCADE"), nullable=True)
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("CoursePost", back_populates="replies")
    author = relationship("User")
    parent = relationship("PostReply", remote_side=[id], backref="children")

    @property
    def author_name(self) -> Optional[str]:
        return self.author.name if self.author else None
