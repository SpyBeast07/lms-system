# MinIO Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### 1. Start Services
```bash
cd /Users/kushagra/Documents/Internship\ @Eurobliz/lms-system
docker compose up -d
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
# or
uv pip install -r requirements.txt
```

### 3. Update .env
```bash
# Copy example and update if needed
cp .env.example .env
```

### 4. Start FastAPI
```bash
uv run uvicorn app.main:app --reload
```

---

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |
| **FastAPI Swagger** | http://localhost:8000/docs | - |
| **PostgreSQL** | localhost:5432 | lms_user / lms_password |

---

## 📤 Upload Your First File

### Via Swagger UI (Easiest)

1. Open http://localhost:8000/docs
2. Find **POST /api/v1/files/upload**
3. Click "Try it out"
4. Set `folder` parameter to `notes`
5. Choose a PDF file
6. Click "Execute"

You'll get back:
```json
{
  "file_url": "http://localhost:9000/lms-files/notes/uuid_yourfile.pdf",
  "size": 1048576,
  ...
}
```

### Via cURL

```bash
curl -X POST "http://localhost:8000/api/v1/files/upload?folder=notes" \
  -F "file=@yourfile.pdf"
```

---

## 🔧 Common Commands

### Docker Management
```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f minio

# Stop services
docker compose down

# Restart MinIO
docker compose restart minio
```

### Check Service Health
```bash
# Check if MinIO is running
curl http://localhost:9000/minio/health/live

# Check containers
docker ps
```

---

## 📁 Folder Structure

```
lms-files/              ← MinIO bucket (auto-created)
├── notes/              ← Course notes PDFs
├── assignments/        ← Assignment files
├── submissions/        ← Student submissions
└── media/              ← Videos, images
```

---

## 💡 Usage in Your Code

### Upload File
```python
from app.core.storage import get_minio_client

async def upload_note(file: UploadFile):
    minio_client = get_minio_client()
    result = await minio_client.upload_file(file, folder="notes")
    return result['file_url']
```

### Generate Secure Download Link
```python
async def get_download_link(object_name: str):
    minio_client = get_minio_client()
    url = minio_client.generate_presigned_url(
        object_name=object_name,
        expiry=3600  # 1 hour
    )
    return url
```

### Delete File
```python
async def delete_note_file(object_name: str):
    minio_client = get_minio_client()
    minio_client.delete_file(object_name)
```

---

## 🗄️ Database Integration

### Update Your Models

```python
class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True)
    title = Column(String)
    
    # MinIO fields
    content_url = Column(String)      # File URL
    object_name = Column(String)      # For deletion
    file_size = Column(Integer)       # Size in bytes
```

### Create with File Upload

```python
async def create_note_with_file(file: UploadFile, title: str):
    # 1. Upload to MinIO
    minio_client = get_minio_client()
    result = await minio_client.upload_file(file, folder="notes")
    
    # 2. Save to database
    note = Note(
        title=title,
        content_url=result['file_url'],
        object_name=result['object_name'],
        file_size=result['size']
    )
    db.add(note)
    await db.commit()
    
    return note
```

---

## 🔒 Security Tips

### ✅ DO:
- Use presigned URLs for private files
- Require authentication for uploads
- Validate file types and sizes
- Keep credentials in `.env` (not in git)

### ❌ DON'T:
- Store files in database as BLOBs
- Make all buckets public
- Commit `.env` to version control
- Skip file validation

---

## 📚 Full Documentation

- **Complete Guide**: [docs/minio_integration.md](file:///Users/kushagra/Documents/Internship%20@Eurobliz/lms-system/docs/minio_integration.md)
- **Integration Example**: [docs/minio_example_integration.py](file:///Users/kushagra/Documents/Internship%20@Eurobliz/lms-system/docs/minio_example_integration.py)
- **Walkthrough**: See artifacts directory

---

## 🆘 Troubleshooting

### MinIO not starting?
```bash
# Check logs
docker compose logs minio

# Restart service
docker compose restart minio
```

### Can't access console?
- URL: http://localhost:9001 (not 9000!)
- Credentials: minioadmin / minioadmin

### File upload fails?
- Check MinIO is running: `docker ps`
- Check bucket exists in console
- Verify `.env` configuration

---

## 🎯 Next Steps

1. ✅ Services are running
2. ⏭️ Test file upload via Swagger
3. ⏭️ Integrate with Notes feature
4. ⏭️ Add to Assignments feature
5. ⏭️ Create database migration

**You're all set!** 🚀
