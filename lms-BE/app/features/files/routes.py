"""
File Upload API Endpoints

FastAPI routes for handling file uploads to MinIO object storage.
Uses a DB-backed FileRecord table for school-scoped file tracking.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional
import logging

from app.core.rate_limiter import limiter
from app.core.storage import get_minio_client
from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from app.features.files.models import FileRecord
from app.schemas.file import (
    FileUploadResponse,
    PresignedURLRequest,
    PresignedURLResponse,
    FileInfoResponse,
    FileListResponse,
    FileListItem,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["Files"])


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=FileUploadResponse, status_code=201)
@limiter.limit("20/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(..., description="File to upload"),
    folder: Optional[str] = Query("", description="Folder path within bucket (e.g., 'notes', 'assignments')"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file to MinIO and register it in the DB with school ownership."""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        minio_client = get_minio_client()

        target_folder = folder or ""
        school_id: Optional[int] = None

        if current_user.role != "super_admin":
            if not current_user.school_id:
                raise HTTPException(status_code=403, detail="User is not assigned to a school")
            school_id = current_user.school_id
            target_folder = f"schools/{school_id}/{target_folder}".strip("/")

        # Upload to MinIO
        result = await minio_client.upload_file(file, folder=target_folder)

        # Save record in DB
        record = FileRecord(
            object_name=result["object_name"],
            original_filename=file.filename,
            size=result["size"],
            content_type=result.get("content_type"),
            school_id=school_id,
            uploaded_by=current_user.id,
        )
        db.add(record)
        await db.commit()

        logger.info(f"File uploaded and recorded: {result['object_name']} (school_id={school_id})")

        return FileUploadResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/list", response_model=FileListResponse)
async def list_files(
    page: int = 1,
    limit: int = 10,
    prefix: Optional[str] = Query("", description="Optional prefix to filter files"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List files from the DB registry, scoped to the user's school."""
    try:
        skip = (page - 1) * limit

        query = select(FileRecord)
        count_query = select(func.count(FileRecord.id))

        if current_user.role != "super_admin":
            if not current_user.school_id:
                raise HTTPException(status_code=403, detail="User is not assigned to a school")
            query = query.where(FileRecord.school_id == current_user.school_id)
            count_query = count_query.where(FileRecord.school_id == current_user.school_id)
        
        # Optional prefix filter on object_name
        if prefix:
            query = query.where(FileRecord.object_name.like(f"{prefix}%"))
            count_query = count_query.where(FileRecord.object_name.like(f"{prefix}%"))

        query = query.order_by(FileRecord.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        records = result.scalars().all()

        count_result = await db.execute(count_query)
        total = count_result.scalar_one()

        items = [
            FileListItem(
                object_name=rec.object_name,
                original_filename=rec.original_filename,
                size=rec.size,
                last_modified=rec.created_at,
                etag="",
                is_dir=False,
                content_type=rec.content_type,
            )
            for rec in records
        ]

        logger.info(f"Listed {len(items)}/{total} files for school_id={current_user.school_id}")

        return FileListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            prefix=prefix or "",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


# ---------------------------------------------------------------------------
# Presigned URL
# ---------------------------------------------------------------------------

@router.post("/presigned-url", response_model=PresignedURLResponse)
async def generate_presigned_url(
    request: PresignedURLRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a temporary presigned URL for secure file access."""
    try:
        target_object = request.object_name

        if current_user.role != "super_admin":
            if not current_user.school_id:
                raise HTTPException(status_code=403, detail="User is not assigned to a school")
            # Verify file belongs to user's school via DB
            result = await db.execute(
                select(FileRecord).where(
                    FileRecord.object_name == target_object,
                    FileRecord.school_id == current_user.school_id,
                )
            )
            if not result.scalars().first():
                raise HTTPException(status_code=403, detail="Cannot access files outside your school")

        minio_client = get_minio_client()

        if not minio_client.file_exists(target_object):
            raise HTTPException(status_code=404, detail="File not found")

        url = minio_client.generate_presigned_url(
            object_name=target_object,
            expiry=request.expiry,
        )

        logger.info(f"Generated presigned URL for: {target_object}")

        return PresignedURLResponse(
            url=url,
            object_name=target_object,
            expiry=request.expiry,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating presigned URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate URL: {str(e)}")


# ---------------------------------------------------------------------------
# File info
# ---------------------------------------------------------------------------

@router.get("/info/{object_name:path}", response_model=FileInfoResponse)
async def get_file_info(
    object_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get metadata information about a file."""
    try:
        if current_user.role != "super_admin":
            if not current_user.school_id:
                raise HTTPException(status_code=403, detail="User is not assigned to a school")
            result = await db.execute(
                select(FileRecord).where(
                    FileRecord.object_name == object_name,
                    FileRecord.school_id == current_user.school_id,
                )
            )
            if not result.scalars().first():
                raise HTTPException(status_code=403, detail="Cannot access files outside your school")

        minio_client = get_minio_client()
        info = minio_client.get_file_info(object_name)

        return FileInfoResponse(**info)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file info: {str(e)}")
        raise HTTPException(status_code=404, detail="File not found")


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{object_name:path}", status_code=204)
async def delete_file(
    object_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a file from MinIO storage and remove its DB record."""
    try:
        # Scope check
        if current_user.role != "super_admin":
            if not current_user.school_id:
                raise HTTPException(status_code=403, detail="User is not assigned to a school")
            result = await db.execute(
                select(FileRecord).where(
                    FileRecord.object_name == object_name,
                    FileRecord.school_id == current_user.school_id,
                )
            )
            record = result.scalars().first()
            if not record:
                raise HTTPException(status_code=403, detail="Cannot delete files outside your school")
        else:
            result = await db.execute(
                select(FileRecord).where(FileRecord.object_name == object_name)
            )
            record = result.scalars().first()

        minio_client = get_minio_client()

        if not minio_client.file_exists(object_name):
            raise HTTPException(status_code=404, detail="File not found")

        minio_client.delete_file(object_name)
        logger.info(f"File deleted: {object_name}")

        # Remove DB record if it exists
        if record:
            await db.delete(record)
            await db.commit()

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
