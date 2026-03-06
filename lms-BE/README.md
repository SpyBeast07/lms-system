# LMS Backend — FastAPI

The backend layer of the LMS System. Built with FastAPI + async SQLAlchemy, it enforces **school-based multitenancy**, **subscription-gated access**, and a **strict role hierarchy** on every request.

---

## 🛠️ Technologies

| Concern | Library |
|---|---|
| Framework | FastAPI (async) |
| Language | Python 3.12+ (`uv`) |
| Database | PostgreSQL via AsyncPG + SQLAlchemy ORM |
| Migrations | Alembic |
| Object Storage | MinIO (S3-compatible) |
| Rate Limiting | SlowAPI + Redis |
| Background Jobs | APScheduler (AsyncIOScheduler) |

---

## 📂 Backend Structure

```text
lms-BE/
├── alembic/
│   └── versions/             # All migration scripts
├── app/
│   ├── core/
│   │   ├── config.py         # Pydantic settings (env vars)
│   │   ├── database.py       # Async SQLAlchemy engine + get_db
│   │   ├── db_base.py        # Declarative Base
│   │   ├── school_guard.py   # ← SchoolGuard dependency
│   │   ├── storage.py        # MinIOClient wrapper
│   │   ├── rate_limiter.py   # SlowAPI + Redis limiter
│   │   ├── cleanup_tasks.py  # APScheduler background jobs
│   │   ├── exceptions.py     # Custom HTTP exception handlers
│   │   ├── pagination.py     # PaginatedResponse generic
│   │   └── response.py       # Standardized API envelope
│   │
│   ├── features/
│   │   ├── auth/             # JWT login, token refresh, password change requests
│   │   ├── schools/          # School CRUD + subscription + principal assignment
│   │   ├── users/            # User management (role-hierarchy scoped)
│   │   ├── courses/          # Course CRUD, soft & hard delete, materials
│   │   ├── enrollments/      # Teacher-course & student-course assignments
│   │   ├── files/            # MinIO upload + DB-backed file registry
│   │   ├── submissions/      # Student submission processing + grading
│   │   ├── notifications/    # Event-driven, deduplicated notification system
│   │   ├── activity_logs/    # System-wide audit logging
│   │   ├── signup_requests/  # Public registration + approval workflow
│   │   ├── ai/               # AI course content generation (Ollama/OpenAI)
│   │   ├── stats/            # Aggregate dashboard statistics
│   │   └── discussion/       # Course-based community & discussion system
│   │
│   └── main.py               # App factory, middleware, router registration
```

Each feature follows this internal layout:
```
feature/
├── models.py     # SQLAlchemy ORM model
├── schemas.py    # Pydantic request/response models
├── service.py    # Business logic + DB queries
└── router.py     # FastAPI route handlers
```

---

## 🏢 School Model & Multitenancy

### School Fields

```python
class School(Base):
    id: int
    name: str                  # unique
    subscription_start: datetime
    subscription_end: datetime  # access expires here
    max_teachers: int           # hard cap on teachers per school
    created_at: datetime
    updated_at: datetime
```

### Relationships
`School` has one-to-many relationships with: `User`, `Course`, `LearningMaterial`, `Submission`, `StudentAssignment` (for MCQ/TEXT), `TeacherCourse`, `StudentCourse`.

### School Isolation in Queries
All service functions accept an optional `school_id` parameter. When provided (for principal/teacher/student roles), queries automatically filter by that column:
```python
school_id = current_user.school_id if current_user.role != "super_admin" else None
return await user_crud.list_users(db, ..., school_id=school_id)
```
Super admins receive `school_id=None`, seeing all data globally.

---

## 🔐 Subscription Enforcement — SchoolGuard

`app/core/school_guard.py` exports a FastAPI `Depends` that is applied to **every non-public, non-super-admin endpoint**:

```python
async def validate_school_subscription(current_user, db) -> School:
    if current_user.role == "super_admin":
        return None                        # bypass
    if not current_user.school_id:
        raise 403                          # not assigned to school
    school = await db.get(School, current_user.school_id)
    if school.subscription_end < datetime.now(UTC):
        raise 403 "School subscription has expired."
    return school
```

When a school's subscription expires every API call from its principals, teachers, and students returns `403 Forbidden` immediately. Data is retained; only active access is blocked.

---

## 🗄️ File Storage — School Isolation

Files are stored in MinIO and tracked in a `file_records` database table:

```
file_records
├── id, object_name (unique)
├── original_filename          # human-readable name
├── size, content_type
├── school_id (FK → schools)   # NULL for super_admin uploads
├── uploaded_by (FK → users)
└── created_at
```

**Upload flow:**  
Non-super-admin uploads are prefixed `schools/{school_id}/{folder}/uuid_filename.ext` in MinIO and a `FileRecord` row is created with `school_id`.

**List/access flow:**  
The list endpoint queries `FileRecord` filtered by `school_id`. Principals only see their school's files. Super admins see all. Presigned URL and delete endpoints verify ownership via DB before acting on MinIO.

---

## 👥 Role Hierarchy & User Creation

| Creator | Can create |
|---|---|
| `super_admin` | `super_admin`, `principal` (with optional `school_id`) |
| `principal` | `teacher` (auto-scoped to principal's school) |
| `teacher` | `student` (auto-scoped to teacher's school) |

When a super_admin creates a principal, they can pass `school_id` in the request body to immediately assign the principal to a school.

---

## 🔑 Auth Flow

1. `POST /auth/login` — returns JWT `access_token` + `refresh_token` (stored as httpOnly-like cookie).
2. JWT payload includes `user_id`, `role`, `school_id` — used by all downstream isolation logic.
3. `POST /auth/refresh` — issues new access token.
4. **Password change requests**: Users request a password change; principal/admin approves or rejects via `/auth/password-requests`.

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

1. **Rate Limiting** — SlowAPI + Redis. Critical routes (`/auth`, `/files/upload`) restrict to 20 req/min.
2. **Background Cleanup** — APScheduler prunes expired refresh tokens and orphaned MinIO files every 12 hours.
3. **Response Standardization** — Global exception handlers wrap all responses in `{ success, data, message, meta }`.
4. **SchoolGuard** — FastAPI dependency enforcing subscription validity on every school-scoped request.
5. **Refined Auto-Grading** — Strict logic ensuring only pure MCQ submissions are auto-evaluated, while mixed assessments (MCQ+TEXT) are held for teacher review.
6. **JSONB Reference Materials** — PostgreSQL JSONB storage used for an extensible array of reference files and external links per assignment.
7. **Discussion Eager Loading** — Implemented `selectinload` for author profiles to ensure community posts and replies are returned with full identity context in a single query.
8. **School-Isolated Community** — Discussion threads are strictly scoped to course enrollments and school IDs, preventing cross-tenant information leaks.
