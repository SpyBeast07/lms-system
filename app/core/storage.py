"""
MinIO Object Storage Configuration and Helper Functions

This module provides S3-compatible object storage functionality using MinIO.
It handles file uploads, downloads, and URL generation for the LMS system.
"""

import os
import uuid
from datetime import timedelta
from typing import BinaryIO, Optional
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)


class MinIOClient:
    """
    MinIO client wrapper for S3-compatible object storage operations.
    
    Attributes:
        endpoint: MinIO server endpoint (e.g., 'localhost:9000')
        access_key: MinIO access key
        secret_key: MinIO secret key
        bucket_name: Default bucket name for file storage
        secure: Whether to use HTTPS (False for local development)
        url_expiry: Default expiry time for presigned URLs in seconds
    """
    
    def __init__(
        self,
        endpoint: str = None,
        access_key: str = None,
        secret_key: str = None,
        bucket_name: str = None,
        secure: bool = False,
        url_expiry: int = 3600
    ):
        """Initialize MinIO client with configuration from environment variables."""
        self.endpoint = endpoint or os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = access_key or os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = secret_key or os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.bucket_name = bucket_name or os.getenv("MINIO_BUCKET_NAME", "lms-files")
        self.secure = secure if secure is not None else os.getenv("MINIO_SECURE", "false").lower() == "true"
        self.url_expiry = url_expiry or int(os.getenv("MINIO_URL_EXPIRY", "3600"))
        
        # Initialize MinIO client
        self.client = Minio(
            endpoint=self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )
        
        # Ensure default bucket exists
        self._ensure_bucket_exists(self.bucket_name)
        
        logger.info(f"MinIO client initialized: endpoint={self.endpoint}, bucket={self.bucket_name}")
    
    def _ensure_bucket_exists(self, bucket_name: str) -> None:
        """
        Create bucket if it doesn't exist.
        
        Args:
            bucket_name: Name of the bucket to create
        """
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"Created bucket: {bucket_name}")
            else:
                logger.debug(f"Bucket already exists: {bucket_name}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise
    
    def _generate_unique_filename(self, original_filename: str, folder: str = "") -> str:
        """
        Generate a unique filename with UUID prefix.
        
        Args:
            original_filename: Original file name
            folder: Optional folder path (e.g., 'notes', 'assignments')
        
        Returns:
            Unique object name with format: folder/uuid_filename.ext
        """
        # Extract file extension
        file_extension = original_filename.split(".")[-1] if "." in original_filename else ""
        
        # Generate unique ID
        unique_id = str(uuid.uuid4())
        
        # Create filename
        if file_extension:
            filename = f"{unique_id}_{original_filename}"
        else:
            filename = f"{unique_id}_{original_filename}"
        
        # Add folder prefix if provided
        if folder:
            return f"{folder.strip('/')}/{filename}"
        return filename
    
    async def upload_file(
        self,
        file: UploadFile,
        folder: str = "",
        bucket_name: Optional[str] = None
    ) -> dict:
        """
        Upload a file to MinIO storage.
        
        Args:
            file: FastAPI UploadFile object
            folder: Folder path within bucket (e.g., 'notes', 'assignments', 'submissions')
            bucket_name: Optional bucket name (defaults to self.bucket_name)
        
        Returns:
            Dictionary containing:
                - object_name: Full object path in bucket
                - file_url: Public URL to access the file
                - bucket: Bucket name
                - size: File size in bytes
        
        Example:
            >>> result = await minio_client.upload_file(file, folder="notes")
            >>> print(result['file_url'])
            http://localhost:9000/lms-files/notes/uuid_document.pdf
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            # Ensure bucket exists
            self._ensure_bucket_exists(bucket)
            
            # Generate unique filename
            object_name = self._generate_unique_filename(file.filename, folder)
            
            # Read file content
            file_content = await file.read()
            file_size = len(file_content)
            
            # Upload to MinIO
            from io import BytesIO
            self.client.put_object(
                bucket_name=bucket,
                object_name=object_name,
                data=BytesIO(file_content),
                length=file_size,
                content_type=file.content_type or "application/octet-stream"
            )
            
            # Generate public URL
            protocol = "https" if self.secure else "http"
            file_url = f"{protocol}://{self.endpoint}/{bucket}/{object_name}"
            
            logger.info(f"File uploaded successfully: {object_name} ({file_size} bytes)")
            
            return {
                "object_name": object_name,
                "file_url": file_url,
                "bucket": bucket,
                "size": file_size,
                "content_type": file.content_type
            }
            
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during file upload: {e}")
            raise
    
    def generate_presigned_url(
        self,
        object_name: str,
        bucket_name: Optional[str] = None,
        expiry: Optional[int] = None
    ) -> str:
        """
        Generate a presigned URL for temporary secure access to a file.
        
        Presigned URLs are temporary URLs that grant access to private objects
        without requiring authentication. They expire after a specified time.
        
        Args:
            object_name: Object path in bucket (e.g., 'notes/uuid_file.pdf')
            bucket_name: Optional bucket name (defaults to self.bucket_name)
            expiry: URL expiry time in seconds (defaults to self.url_expiry)
        
        Returns:
            Presigned URL string
        
        Example:
            >>> url = minio_client.generate_presigned_url("notes/file.pdf", expiry=3600)
            >>> # URL valid for 1 hour
        """
        bucket = bucket_name or self.bucket_name
        expiry_seconds = expiry or self.url_expiry
        
        try:
            url = self.client.presigned_get_object(
                bucket_name=bucket,
                object_name=object_name,
                expires=timedelta(seconds=expiry_seconds)
            )
            logger.info(f"Generated presigned URL for {object_name} (expires in {expiry_seconds}s)")
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def delete_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> bool:
        """
        Delete a file from MinIO storage.
        
        Args:
            object_name: Object path in bucket
            bucket_name: Optional bucket name (defaults to self.bucket_name)
        
        Returns:
            True if deletion successful
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            self.client.remove_object(bucket_name=bucket, object_name=object_name)
            logger.info(f"File deleted successfully: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file: {e}")
            raise
    
    def file_exists(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> bool:
        """
        Check if a file exists in MinIO storage.
        
        Args:
            object_name: Object path in bucket
            bucket_name: Optional bucket name (defaults to self.bucket_name)
        
        Returns:
            True if file exists, False otherwise
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            self.client.stat_object(bucket_name=bucket, object_name=object_name)
            return True
        except S3Error:
            return False
    
    def get_file_info(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> dict:
        """
        Get metadata information about a file.
        
        Args:
            object_name: Object path in bucket
            bucket_name: Optional bucket name (defaults to self.bucket_name)
        
        Returns:
            Dictionary with file metadata
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            stat = self.client.stat_object(bucket_name=bucket, object_name=object_name)
            return {
                "object_name": object_name,
                "size": stat.size,
                "last_modified": stat.last_modified,
                "content_type": stat.content_type,
                "etag": stat.etag
            }
        except S3Error as e:
            logger.error(f"Error getting file info: {e}")
            raise
    
    def list_files(
        self,
        prefix: str = "",
        bucket_name: Optional[str] = None
    ) -> list[dict]:
        """
        List all files in the MinIO bucket.
        
        Args:
            prefix: Optional prefix to filter files (e.g., 'notes/', 'assignments/')
            bucket_name: Optional bucket name (defaults to self.bucket_name)
        
        Returns:
            List of dictionaries containing file information:
                - object_name: Full object path
                - size: File size in bytes
                - last_modified: Last modification timestamp
                - etag: Entity tag (hash)
        
        Example:
            >>> files = minio_client.list_files(prefix="notes/")
            >>> for file in files:
            ...     print(file['object_name'], file['size'])
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            # Ensure bucket exists
            if not self.client.bucket_exists(bucket):
                logger.warning(f"Bucket {bucket} does not exist")
                return []
            
            # List objects
            objects = self.client.list_objects(
                bucket_name=bucket,
                prefix=prefix,
                recursive=True
            )
            
            # Convert to list of dicts
            files = []
            for obj in objects:
                files.append({
                    "object_name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified,
                    "etag": obj.etag,
                    "is_dir": obj.is_dir
                })
            
            logger.info(f"Listed {len(files)} files from bucket {bucket} with prefix '{prefix}'")
            return files
            
        except S3Error as e:
            logger.error(f"Error listing files: {e}")
            raise


# Global MinIO client instance
_minio_client: Optional[MinIOClient] = None


def get_minio_client() -> MinIOClient:
    """
    Get or create the global MinIO client instance.
    
    This function implements a singleton pattern to ensure only one
    MinIO client instance is created and reused throughout the application.
    
    Returns:
        MinIOClient instance
    """
    global _minio_client
    if _minio_client is None:
        _minio_client = MinIOClient()
    return _minio_client
