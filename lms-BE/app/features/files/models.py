from sqlalchemy import Integer, ForeignKey, String, DateTime, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from typing import Optional

from app.core.db_base import Base


class FileRecord(Base):
    """Tracks every file uploaded to MinIO with school ownership."""

    __tablename__ = "file_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    object_name: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    """Full object path in MinIO bucket (e.g., schools/1/notes/uuid_file.pdf)"""

    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    """Original filename as provided by the user (e.g., lecture_notes.pdf)"""

    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    """File size in bytes"""

    content_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    """MIME type (e.g., application/pdf, image/jpeg)"""

    school_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    """NULL for super_admin uploads (global), set to school id for school-scoped uploads"""

    uploaded_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    """User who uploaded the file"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    # Relationships
    uploader = relationship("User")
    school = relationship("School")
