"""Files feature module."""

from app.features.files.routes import router
from app.features.files.models import FileRecord

__all__ = ["router", "FileRecord"]
