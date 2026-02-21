"""
File Upload API Endpoints

FastAPI routes for handling file uploads to MinIO object storage.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Request
from typing import Optional
import logging

from app.core.rate_limiter import limiter

from app.core.storage import get_minio_client
from app.schemas.file import (
    FileUploadResponse,
    PresignedURLRequest,
    PresignedURLResponse,
    FileInfoResponse,
    FileListResponse,
    FileListItem
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload", response_model=FileUploadResponse, status_code=201)
@limiter.limit("20/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(..., description="File to upload"),
    folder: Optional[str] = Query(
        "",
        description="Folder path within bucket (e.g., 'notes', 'assignments', 'submissions')"
    )
):
    """
    Upload a file to MinIO object storage.
    
    **Process:**
    1. Receives file from client
    2. Generates unique filename with UUID
    3. Uploads to MinIO bucket
    4. Returns public file URL
    
    **Supported file types:**
    - PDFs (notes, assignments)
    - Images (JPEG, PNG, GIF)
    - Documents (DOCX, XLSX, PPTX)
    - Videos (MP4, AVI, MOV)
    - Archives (ZIP, RAR)
    
    **Example Response:**
    ```json
    {
        "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
        "file_url": "http://localhost:9000/lms-files/notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
        "bucket": "lms-files",
        "size": 1048576,
        "content_type": "application/pdf"
    }
    ```
    
    **Usage in LMS:**
    - Upload notes PDFs: `folder="notes"`
    - Upload assignments: `folder="assignments"`
    - Upload student submissions: `folder="submissions"`
    - Upload media files: `folder="media"`
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Get MinIO client
        minio_client = get_minio_client()
        
        # Upload file
        result = await minio_client.upload_file(file, folder=folder)
        
        logger.info(f"File uploaded: {result['object_name']}")
        
        return FileUploadResponse(**result)
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.post("/presigned-url", response_model=PresignedURLResponse)
async def generate_presigned_url(request: PresignedURLRequest):
    """
    Generate a temporary presigned URL for secure file access.
    
    **What is a Presigned URL?**
    A presigned URL is a temporary URL that grants access to a private file
    without requiring authentication. It expires after a specified time.
    
    **Use Cases:**
    - Secure file downloads for authenticated users
    - Temporary file sharing
    - Time-limited access to sensitive documents
    
    **Security Benefits:**
    - No need to make files publicly accessible
    - Automatic expiration prevents unauthorized long-term access
    - Can be generated per-user for access tracking
    
    **Example Request:**
    ```json
    {
        "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
        "expiry": 3600
    }
    ```
    
    **Example Response:**
    ```json
    {
        "url": "http://localhost:9000/lms-files/notes/file.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
        "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
        "expiry": 3600
    }
    ```
    """
    try:
        minio_client = get_minio_client()
        
        # Check if file exists
        if not minio_client.file_exists(request.object_name):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Generate presigned URL
        url = minio_client.generate_presigned_url(
            object_name=request.object_name,
            expiry=request.expiry
        )
        
        logger.info(f"Generated presigned URL for: {request.object_name}")
        
        return PresignedURLResponse(
            url=url,
            object_name=request.object_name,
            expiry=request.expiry
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating presigned URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate URL: {str(e)}")


@router.get("/info/{object_name:path}", response_model=FileInfoResponse)
async def get_file_info(object_name: str):
    """
    Get metadata information about a file.
    
    **Returns:**
    - File size
    - Last modified timestamp
    - Content type
    - ETag (hash)
    
    **Example:**
    ```
    GET /api/v1/files/info/notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf
    ```
    """
    try:
        minio_client = get_minio_client()
        
        # Get file info
        info = minio_client.get_file_info(object_name)
        
        return FileInfoResponse(**info)
        
    except Exception as e:
        logger.error(f"Error getting file info: {str(e)}")
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/list", response_model=FileListResponse)
async def list_files(
    page: int = 1,
    limit: int = 10,
    prefix: Optional[str] = Query(
        "",
        description="Optional prefix to filter files (e.g., 'notes/', 'assignments/')"
    )
):
    """
    List all files in the MinIO bucket with pagination.
    """
    try:
        minio_client = get_minio_client()
        
        # List files with pagination
        data = minio_client.list_files(prefix=prefix, page=page, limit=limit)
        
        # Convert items to response models
        items = [FileListItem(**file) for file in data['items']]
        
        logger.info(f"Listed {len(items)}/{data['total']} files with prefix '{prefix}' (page {page})")
        
        return FileListResponse(
            items=items,
            total=data['total'],
            page=data['page'],
            limit=data['limit'],
            prefix=prefix
        )
        
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.delete("/{object_name:path}", status_code=204)
async def delete_file(object_name: str):
    """
    Delete a file from MinIO storage.
    
    **Warning:** This operation is irreversible!
    
    **Example:**
    ```
    DELETE /api/v1/files/notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf
    ```
    """
    try:
        minio_client = get_minio_client()
        
        # Check if file exists
        if not minio_client.file_exists(object_name):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete file
        minio_client.delete_file(object_name)
        
        logger.info(f"File deleted: {object_name}")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
