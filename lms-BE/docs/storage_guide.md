# Storage & File Management Guide

This guide covers the MinIO object storage integration used for managing course materials, assignments, and student submissions.

## 🚀 Quick Setup

1. **Start Services**: `docker compose up -d` (PostgreSQL, Redis, MinIO)
2. **Access Console**: [http://localhost:9001](http://localhost:9001) (Credentials: `minioadmin` / `minioadmin`)
3. **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📁 Storage Architecture

- **Bucket**: `lms-files` (auto-created)
- **Folder Structure**:
    - `notes/`: Course materials
    - `assignments/`: Teacher tasks
    - `submissions/`: Student work

## 🛠️ API Usage

### 1. Uploading Files
- **Endpoint**: `POST /api/v1/files/upload?folder={folder}`
- **Behavior**: Returns a unique `object_name` and a public `file_url`.

### 2. Listing Files
- **Endpoint**: `GET /api/v1/files/list?prefix={folder}`
- **Purpose**: Retrieves metadata (size, last modified) for all files in a specific folder.

### 3. Secure Access (Presigned URLs)
- **Endpoint**: `POST /api/v1/files/presigned-url`
- **Use Case**: Generate temporary (e.g., 1-hour) download links for private submissions.

## 💡 Implementation Best Practices

1. **Metadata in DB, Files in MinIO**: Always store the `object_name` and `file_url` in your SQL database models. Never store file binaries in the database.
2. **Automatic Cleanup**: The system includes a background job (`APScheduler`) that prunes orphaned MinIO files not referenced in the database.
3. **Presigned URLs**: Use presigned URLs for any files that require permission-based access (like grading results).

## 🔒 Configuration (.env)
```env
MINIO_URL=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
```
