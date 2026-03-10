# LMS Backend — FastAPI

The backend layer of the LMS System. Built with FastAPI + async SQLAlchemy, it enforces **school-based multitenancy**, **subscription-gated access**, and a **strict role hierarchy** on every request.

---

## 🛠️ Technologies

| Concern | Library / Service |
|---|---|
| Framework | FastAPI (async) |
| Language | Python 3.12+ |
| Database | PostgreSQL (Neon - Serverless) via AsyncPG |
| ORM | SQLAlchemy 2.0 |
| Cache | Redis (Upstash) |
| Object Storage | Cloudflare R2 (S3-Compatible) |
| Rate Limiting | SlowAPI + Redis |
| Background Jobs | APScheduler |

---

## 🚀 Production Deployment (Render)

The backend is deployed as a Docker service on Render.

- **URL**: `https://lms-system-ecuw.onrender.com`
- **Auto-Scale**: Configured for low-memory environments (512MB).
- **Auto-Migrations**: `alembic upgrade head` runs automatically on boot.

### Environment Variables
Key variables required for production:
- `DATABASE_URL`: Neon PostgreSQL connection string.
- `REDIS_URL`: Upstash Redis connection string.
- `MINIO_ENDPOINT`: Cloudflare R2 endpoint.
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`: R2 credentials.
- `ROOT_PATH`: Should be empty for direct Render deployment.

---

## 🗄️ File Storage — Cloudflare R2

We migrated from local MinIO to **Cloudflare R2** for production-grade reliability.

**Workflow:**
1. Files are uploaded via the `/v1/files/upload` endpoint.
2. The system stores metadata in the `file_records` table, scoped by `school_id`.
3. Files are stored and retrieved using HTTPS presigned URLs with an expiry window of 3600 seconds.

---

## 🐳 Running Locally (Docker)

From the root directory:

```bash
docker compose up -d --build backend
```

In the local environment:
- The server starts with `--root-path /api` to work with the Caddy reverse proxy.
- Database and storage default to the local Docker services unless overridden in `.env`.

---

## 🔑 Auth Flow

1. `POST /auth/login` — issues JWT.
2. `POST /auth/refresh` — rotates credentials using Upstash Redis for session state.
3. **Multitenancy**: Every request is intercepted by the `SchoolGuard` dependency to ensure the user's school subscription is active.
 JSONB storage used for an extensible array of reference files and external links per assignment.
9. **Discussion Eager Loading** — Implemented `selectinload` for author profiles to ensure community posts and replies are returned with full identity context in a single query.
10. **School-Isolated Community** — Discussion threads are strictly scoped to course enrollments and school IDs, preventing cross-tenant information leaks.
