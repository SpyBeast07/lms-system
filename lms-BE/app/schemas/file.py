"""
File Upload Schemas

Pydantic models for file upload requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FileUploadResponse(BaseModel):
    """Response model for file upload operations."""
    
    object_name: str = Field(..., description="Full object path in MinIO bucket")
    file_url: str = Field(..., description="Public URL to access the file")
    bucket: str = Field(..., description="Bucket name where file is stored")
    size: int = Field(..., description="File size in bytes")
    content_type: Optional[str] = Field(None, description="MIME type of the file")
    
    class Config:
        json_schema_extra = {
            "example": {
                "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
                "file_url": "http://localhost:9000/lms-files/notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
                "bucket": "lms-files",
                "size": 1048576,
                "content_type": "application/pdf"
            }
        }


class PresignedURLRequest(BaseModel):
    """Request model for generating presigned URLs."""
    
    object_name: str = Field(..., description="Object path in bucket")
    expiry: Optional[int] = Field(3600, description="URL expiry time in seconds (default: 1 hour)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
                "expiry": 3600
            }
        }


class PresignedURLResponse(BaseModel):
    """Response model for presigned URL generation."""
    
    url: str = Field(..., description="Temporary presigned URL")
    object_name: str = Field(..., description="Object path in bucket")
    expiry: int = Field(..., description="URL expiry time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "http://localhost:9000/lms-files/notes/file.pdf?X-Amz-Algorithm=...",
                "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
                "expiry": 3600
            }
        }


class FileInfoResponse(BaseModel):
    """Response model for file metadata."""
    
    object_name: str = Field(..., description="Object path in bucket")
    size: int = Field(..., description="File size in bytes")
    last_modified: datetime = Field(..., description="Last modification timestamp")
    content_type: Optional[str] = Field(None, description="MIME type of the file")
    etag: str = Field(..., description="Entity tag (hash) of the file")
    
    class Config:
        json_schema_extra = {
            "example": {
                "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
                "size": 1048576,
                "last_modified": "2026-02-16T12:00:00Z",
                "content_type": "application/pdf",
                "etag": "d41d8cd98f00b204e9800998ecf8427e"
            }
        }


class FileListItem(BaseModel):
    """Individual file item in the list."""
    
    object_name: str = Field(..., description="Full object path in bucket")
    original_filename: str = Field("", description="Original filename as uploaded by the user")
    size: int = Field(..., description="File size in bytes")
    last_modified: datetime = Field(..., description="Last modification timestamp")
    etag: str = Field("", description="Entity tag (hash) of the file")
    is_dir: bool = Field(False, description="Whether this is a directory")
    content_type: Optional[str] = Field(None, description="MIME type of the file")
    
    class Config:
        json_schema_extra = {
            "example": {
                "object_name": "notes/550e8400-e29b-41d4-a716-446655440000_lecture.pdf",
                "size": 1048576,
                "last_modified": "2026-02-16T12:00:00Z",
                "etag": "d41d8cd98f00b204e9800998ecf8427e",
                "is_dir": False
            }
        }


class FileListResponse(BaseModel):
    """Response model for listing files with pagination."""
    
    items: list[FileListItem] = Field(..., description="List of files in the bucket")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    prefix: str = Field("", description="Prefix filter used")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "object_name": "notes/file1.pdf",
                        "size": 1048576,
                        "last_modified": "2026-02-16T12:00:00Z",
                        "etag": "abc123",
                        "is_dir": False
                    }
                ],
                "total": 1,
                "page": 1,
                "limit": 10,
                "prefix": "notes/"
            }
        }
