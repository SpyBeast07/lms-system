"""
Example: Integrating MinIO with Learning Materials

This example shows how to modify the existing learning materials feature
to use MinIO for file storage instead of storing files in the database.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.storage import get_minio_client
from app.features.auth.dependencies import get_current_user
from pydantic import BaseModel
from datetime import datetime

# ============================================
# MODELS (Add to existing models.py)
# ============================================

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.core.db_base import Base

class LearningMaterial(Base):
    """
    Learning Material model with MinIO integration.
    
    Instead of storing file_data as BLOB, we store:
    - content_url: Public URL from MinIO
    - object_name: Object path in MinIO (for deletion)
    - file_size: Size in bytes
    - content_type: MIME type
    """
    __tablename__ = "learning_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # MinIO integration fields
    content_url = Column(String)      # http://localhost:9000/lms-files/notes/uuid_file.pdf
    object_name = Column(String)      # notes/uuid_file.pdf
    file_size = Column(Integer)       # Size in bytes
    content_type = Column(String)     # application/pdf
    
    # Relationships
    course_id = Column(Integer, ForeignKey("courses.id"))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================
# SCHEMAS (Add to existing schemas.py)
# ============================================

class LearningMaterialCreate(BaseModel):
    """Schema for creating learning material."""
    title: str
    description: str | None = None
    course_id: int


class LearningMaterialResponse(BaseModel):
    """Schema for learning material response."""
    id: int
    title: str
    description: str | None
    content_url: str
    file_size: int
    content_type: str
    course_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# SERVICE LAYER
# ============================================

class LearningMaterialService:
    """Service for managing learning materials with MinIO."""
    
    @staticmethod
    async def create_material(
        db: AsyncSession,
        file: UploadFile,
        title: str,
        description: str | None,
        course_id: int,
        user_id: int
    ) -> LearningMaterial:
        """
        Create a new learning material with file upload.
        
        Flow:
        1. Upload file to MinIO
        2. Store metadata in PostgreSQL
        3. Return material with URL
        """
        # Upload to MinIO
        minio_client = get_minio_client()
        upload_result = await minio_client.upload_file(file, folder="notes")
        
        # Create database record
        material = LearningMaterial(
            title=title,
            description=description,
            content_url=upload_result['file_url'],
            object_name=upload_result['object_name'],
            file_size=upload_result['size'],
            content_type=upload_result['content_type'],
            course_id=course_id,
            uploaded_by=user_id
        )
        
        db.add(material)
        await db.commit()
        await db.refresh(material)
        
        return material
    
    @staticmethod
    async def get_material(db: AsyncSession, material_id: int) -> LearningMaterial:
        """Get learning material by ID."""
        result = await db.execute(
            select(LearningMaterial).where(LearningMaterial.id == material_id)
        )
        material = result.scalar_one_or_none()
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        return material
    
    @staticmethod
    async def get_secure_download_url(
        db: AsyncSession,
        material_id: int,
        expiry: int = 3600
    ) -> str:
        """
        Generate a presigned URL for secure download.
        
        Use this for:
        - Private course materials
        - Student-only access
        - Time-limited downloads
        """
        material = await LearningMaterialService.get_material(db, material_id)
        
        minio_client = get_minio_client()
        presigned_url = minio_client.generate_presigned_url(
            object_name=material.object_name,
            expiry=expiry
        )
        
        return presigned_url
    
    @staticmethod
    async def delete_material(db: AsyncSession, material_id: int) -> None:
        """
        Delete learning material and its file.
        
        Important: Delete file from MinIO first, then database record.
        """
        material = await LearningMaterialService.get_material(db, material_id)
        
        # Delete from MinIO
        minio_client = get_minio_client()
        minio_client.delete_file(material.object_name)
        
        # Delete from database
        await db.delete(material)
        await db.commit()


# ============================================
# API ROUTES
# ============================================

router = APIRouter(prefix="/learning-materials", tags=["Learning Materials"])


@router.post("/", response_model=LearningMaterialResponse, status_code=201)
async def create_learning_material(
    title: str,
    course_id: int,
    description: str | None = None,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new learning material with file upload.
    
    Example:
    - Upload lecture notes PDF
    - Upload assignment instructions
    - Upload study materials
    """
    material = await LearningMaterialService.create_material(
        db=db,
        file=file,
        title=title,
        description=description,
        course_id=course_id,
        user_id=current_user.id
    )
    
    return material


@router.get("/{material_id}", response_model=LearningMaterialResponse)
async def get_learning_material(
    material_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get learning material details."""
    material = await LearningMaterialService.get_material(db, material_id)
    return material


@router.get("/{material_id}/download-url")
async def get_download_url(
    material_id: int,
    expiry: int = 3600,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a secure presigned URL for downloading the file.
    
    The URL expires after the specified time (default: 1 hour).
    This ensures only authenticated users can download files.
    """
    url = await LearningMaterialService.get_secure_download_url(
        db=db,
        material_id=material_id,
        expiry=expiry
    )
    
    return {
        "download_url": url,
        "expiry_seconds": expiry
    }


@router.delete("/{material_id}", status_code=204)
async def delete_learning_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete learning material and its file from MinIO."""
    await LearningMaterialService.delete_material(db, material_id)
    return None


# ============================================
# MIGRATION GUIDE
# ============================================

"""
To integrate this with your existing LMS:

1. Create database migration:
   ```bash
   alembic revision --autogenerate -m "Add MinIO fields to learning materials"
   alembic upgrade head
   ```

2. Update existing models:
   - Add content_url, object_name, file_size, content_type fields
   - Remove file_data BLOB field

3. Migrate existing files (if any):
   ```python
   async def migrate_existing_files():
       materials = await db.execute(select(LearningMaterial))
       for material in materials.scalars():
           if material.file_data:
               # Upload to MinIO
               file = BytesIO(material.file_data)
               result = await minio_client.upload_file(file, folder="notes")
               
               # Update record
               material.content_url = result['file_url']
               material.object_name = result['object_name']
               material.file_data = None  # Clear old data
       
       await db.commit()
   ```

4. Update frontend:
   - Change file download links to use content_url
   - For secure downloads, call /download-url endpoint first
"""
