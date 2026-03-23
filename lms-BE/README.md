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

1. `POST /auth/login` — returns JWT `access_token` + `refresh_token` (stored as httpOnly-like cookie).
2. JWT payload includes `user_id`, `role`, `school_id` — used by all downstream isolation logic.
3. `POST /auth/refresh` — issues new access token.
4. **Password change requests**: Users request a password change; principal/admin approves or rejects via `/auth/password-requests`.
5. **Google OAuth**: Native Single Sign-On integration handling user login, signup mapping, and automatic redirect URI resolution seamlessly behind reverse proxies.

---

## 📋 API Endpoints Summary

| Prefix | Tag | Access |
|---|---|---|
| `/auth/...` | Auth | Public (login), Protected (refresh, password) |
| `/users/` | Users | super_admin, principal, teacher |
| `/schools/` | Schools | super_admin only (CRUD + assign-principal) |
| `/schools/public` | Schools | Public (school list for signup) |
| `/courses/` | Courses | principal, teacher |
| `/api/v1/files/` | Files | principal (school-scoped), super_admin |
| `/submissions/` | Submissions | teacher, student |
| `/submissions/teacher` | Evaluations | teacher |
| `/notifications/` | Notifications | all roles |
| `/activity-logs/` | Logs | all roles (filtered by role) |
| `/signup-requests/` | Signup | public (create), principal/super_admin (approve) |
| `/ai/` | AI | teacher |
| `/stats/` | Stats | principal, super_admin |
| `/courses/{id}/posts` | Community | teacher, student |
| `/posts/{id}/reply` | Community | teacher, student |

---

## 🚀 Getting Started

### 1. Requirements
Python 3.12+, `uv`, Docker (or manual PostgreSQL + Redis + MinIO).

### 2. Start Infrastructure
```bash
docker compose up -d   # starts postgres, redis, minio
```

### 3. Install & Configure
```bash
uv venv && source .venv/bin/activate
uv sync
cp .env.example .env   # fill in credentials
```

### 4. Run Migrations
```bash
uv run alembic upgrade head
```
> For any SQLAlchemy model change: `uv run alembic revision --autogenerate -m "description"`

### 5. Start Server
```bash
uv run uvicorn app.main:app --reload
```
Swagger UI: http://127.0.0.1:8000/docs

---

## 🛡️ Production Hardening

1. **Rate Limiting** — SlowAPI + Redis. Critical routes (`/auth`, `/files/upload`) restrict to 20 req/min. Redis URL is configured via `REDIS_URL` environment variable.
2. **Background Cleanup** — APScheduler prunes expired refresh tokens and orphaned MinIO files every 12 hours.
3. **Response Standardization** — Global exception handlers wrap all responses in `{ success, data, message, meta }`.
4. **SchoolGuard** — FastAPI dependency enforcing subscription validity on every school-scoped request.
5. **Auto-Migration** — `alembic upgrade head` runs automatically inside the Docker container before the server starts.
6. **Caddy Proxy Compatibility** — Server starts with `--root-path /api` so Swagger UI correctly resolves `/api/openapi.json` through the reverse proxy.
7. **Refined Auto-Grading & Assessments** — Strict logic ensuring only pure MCQ submissions (including multiple-selection answers) are auto-evaluated, while mixed assessments (MCQ+TEXT) are held for teacher review.
8. **JSONB Reference Materials** — PostgreSQL JSONB storage used for an extensible array of reference files and external links per assignment.
9. **Discussion Eager Loading** — Implemented `selectinload` for author profiles to ensure community posts and replies are returned with full identity context in a single query.
10. **School-Isolated Community** — Discussion threads are strictly scoped to course enrollments and school IDs, preventing cross-tenant information leaks.
