from sqlalchemy import Integer, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db_base import Base

class Notes(Base):
    __tablename__ = "notes"

    material_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("learning_material.id", ondelete="CASCADE"),
        primary_key=True
    )

    content_url: Mapped[str] = mapped_column(String, nullable=False)
    
    material = relationship("LearningMaterial", back_populates="notes")