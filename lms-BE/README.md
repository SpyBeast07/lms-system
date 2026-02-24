# Eurobliz LMS System - Backend (FastAPI)

The backend layer of the Eurobliz LMS, built with modern Python, FastAPI, and asynchronous SQLAlchemy. It is designed for high performance, strict typing, and domain-driven modularity.

## 🛠️ Technologies
- **Framework:** FastAPI
- **Language:** Python 3.12+ (managed via `uv`)
- **Database:** PostgreSQL (AsyncPG driver) with SQLAlchemy ORM
- **Migrations:** Alembic
- **Object Storage:** MinIO (S3 Compatible)
- **Caching & Rate Limiting:** Redis & SlowAPI
- **Cron Jobs:** APScheduler (AsyncIOScheduler)

## 📂 Backend Structure
The project follows a **feature-based** directory layout.
```text
lms-BE/
├── alembic/              # Migration configurations
├── app/
│   ├── core/             # Global configurations, DB Session setup, Exceptions, standard Responses, Storage connections
│   ├── features/         # Domain specific modules.
│   │   ├── activity_logs/
│   │   ├── ai/           # Unified Course Content Generation (Ollama/OpenAI)
│   │   ├── auth/         # JWT Security, Password Hashing
│   │   ├── courses/      # Course Creation, Material Uploads, Hard Delete (Super Admin)
│   │   ├── enrollments/  # Teacher-Student assignments and course access
│   │   ├── notifications/# Smart Deduplicating Notifications
│   │   ├── signup_requests/# Admin/Principal Approval Registration Flow
│   │   ├── submissions/  # Student Document processing & Teacher Grading Audit
│   │   └── users/        # Administration profiles with Hard Delete (Super Admin)
│   └── main.py           # Application Entry Point & Exception interceptors
```

Each feature directory (e.g., `features/submissions/`) typically contains:
- `router.py`: FastAPI endpoints.
- `schemas.py`: Pydantic models for validation.
- `models.py`: SQLAlchemy database models.
- `service.py`: Business logic and database operations.

## 🚀 Getting Started

### 1. Requirements
Ensure you have Python 3.12+ and `uv` installed. You will also need active instances of PostgreSQL, Redis, and MinIO.

### 2. Installation
```bash
# Create a virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv sync # or uv pip install
```

### 3. Environment Variables
Create a `.env` file referencing `.env.example`:
```ini
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/lms
ASYNC_DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/lms
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MinIO
MINIO_URL=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password
MINIO_SECURE=false

# AI Assistance (Ollama/OpenAI)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
```

### 4. Database Migrations
Always ensure your database is up-to-date:
```bash
uv run alembic upgrade head
```
*Note: If you make changes to `models.py`, generate a new migration via `uv run alembic revision --autogenerate -m "message"`.*

### 5. Running the Application
```bash
uv run uvicorn app.main:app --reload
```
Access the interactive Swagger UI documentation at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## 🛡️ Production Hardening
This backend includes built-in operational resilience:
1. **Rate Limiting:** Managed via `slowapi` utilizing a Redis connection backend. Critical routes like `/auth` and `/files/upload` are heavily restricted to prevent abuse.
2. **Background Cleanups:** An asynchronous job scheduler (`APScheduler`) systematically purges expired tokens and orphaned MinIO files every 12 hours.
3. **Response Standardization:** Every outbound request (excluding pure binary/auth pipelines) is globally intercepted and formatted into `{ success, data, message, meta }` to ensure fault-tolerant frontend integrations.
