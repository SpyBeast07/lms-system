# LMS System

A multi-tenant, school-isolated Learning Management System (LMS) for educational institutions. The system enforces **school-based data isolation**, **subscription-gated access**, and a strict **role hierarchy** across all operations.

---

## 🏗️ Architecture Overview

This is a full-stack monorepo:

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + Python 3.12 |
| Database | PostgreSQL (async SQLAlchemy) |
| Migrations | Alembic |
| Object Storage | MinIO (S3-compatible) |
| Cache / Rate Limiting | Redis + SlowAPI |
| Background Jobs | APScheduler |

---

## 🏢 School-Based Multitenancy

Every entity in the system (users, courses, materials, submissions, enrollments, uploaded files) is **scoped to a School**. Data never crosses school boundaries.

### How Isolation Works

- **Database layer:** Every query for non-super-admin users automatically filters by `school_id` extracted from the authenticated user's JWT.
- **Storage layer (MinIO):** Files are stored under a `schools/{school_id}/` prefix and tracked in a `file_records` DB table with `school_id`, preventing cross-school access even at the URL level.
- **Request layer (SchoolGuard):** A FastAPI dependency (`validate_school_subscription`) is applied to all school-scoped endpoints. It verifies:
  1. The user is assigned to a school (`school_id` not null).
  2. The school's `subscription_end` date is in the future.
  - Super admins bypass this check entirely.

### School Model

```
School
├── id, name (unique)
├── subscription_start, subscription_end  ← enforces active access window
├── max_teachers                          ← caps teacher creation per school
└── created_at, updated_at
```

---

## 👥 Role Hierarchy

```
super_admin
    └── manages: schools, subscription windows, principal assignment
principal  (scoped to one school)
    └── manages: teachers, courses, enrollments, file storage, signup approvals
teacher    (scoped to one school)
    └── manages: materials, assignments, student submissions & grading
student    (scoped to one school)
    └── accesses: enrolled courses, materials, assignments, submissions
```

| Capability | super_admin | principal | teacher | student |
|---|:---:|:---:|:---:|:---:|
| Manage schools & subscriptions | ✅ | ❌ | ❌ | ❌ |
| Create / assign principals | ✅ | ❌ | ❌ | ❌ |
| Manage teachers | ❌ | ✅ | ❌ | ❌ |
| Manage courses | ❌ | ✅ | ❌ | ❌ |
| Upload learning materials | ❌ | ❌ | ✅ | ❌ |
| Grade submissions | ❌ | ❌ | ✅ | ❌ |
| View & submit assignments | ❌ | ❌ | ❌ | ✅ |
| Evaluate & Grade Assessments | ❌ | ❌ | ✅ | ❌ |
| Manage Reference Materials | ❌ | ❌ | ✅ | ❌ |
| Access file storage | ❌ | ✅ (school-scoped) | ❌ | ❌ |

---

## 🔐 Subscription System

Schools are given an access window (`subscription_start` → `subscription_end`). When a subscription expires:
- All non-super-admin endpoints immediately return **403 Forbidden**.
- Education data is preserved — only active access is suspended.
- Super admin can renew by updating `subscription_end` via the Schools Management API.

---

## 🛠️ Technology Stack

### Frontend (`/lms-FE`)
- **Core:** React 18, TypeScript, Vite
- **Routing:** TanStack Router (type-safe, file-based)
- **Data Fetching:** TanStack Query (React Query)
- **State:** Zustand (auth session, UI flags only)
- **Forms:** React Hook Form + Zod
- **Styling:** TailwindCSS

### Backend (`/lms-BE`)
- **Framework:** FastAPI (async)
- **ORM:** SQLAlchemy (async) + PostgreSQL
- **Migrations:** Alembic
- **Storage:** MinIO (school-isolated, DB-tracked)
- **Rate Limiting:** SlowAPI + Redis
- **Background Jobs:** APScheduler

---

## 📂 Project Structure

```
lms-system/
├── lms-BE/                   # FastAPI Backend
│   ├── alembic/              # DB migration scripts
│   ├── app/
│   │   ├── core/             # Config, DB, Storage, SchoolGuard, Rate limiter
│   │   ├── features/
│   │   │   ├── auth/         # JWT auth, password change requests
│   │   │   ├── schools/      # School CRUD, subscription, principal assignment
│   │   │   ├── users/        # User management (role-scoped)
│   │   │   ├── courses/      # Course + learning materials
│   │   │   ├── enrollments/  # Teacher & student course assignments
│   │   │   ├── files/        # MinIO upload + DB-backed school-scoped file registry
│   │   │   ├── submissions/  # Student submissions + grading
│   │   │   ├── notifications/
│   │   │   ├── activity_logs/
│   │   │   ├── signup_requests/
│   │   │   ├── ai/           # AI course content generation
│   │   │   ├── stats/
│   │   │   └── discussion/   # Course-based community & discussion system
│   │   └── main.py
│   └── .env.example
│
├── lms-FE/                   # React Frontend
│   ├── src/
│   │   ├── app/              # Router, Zustand stores
│   │   └── features/
│   │       ├── admin/        # Super admin dashboard (schools, users)
│   │       ├── principal/    # Principal dashboard (courses, teachers, files)
│   │       ├── teacher/      # Teacher dashboard
│   │       ├── student/      # Student dashboard
│   │       ├── schools/      # School management UI
│   │       ├── files/        # File storage (principal-only)
│   │       ├── auth/         # Login, password management
│   │       ├── signup/       # Public registration + approval flow
│   │       ├── courses/      # Course management & Community Portal
│   │       ├── enrollments/
│   │       ├── materials/
│   │       ├── submissions/
│   │       ├── notifications/
│   │       ├── activityLogs/
│   │       ├── ai/
│   │       └── health/
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- Python 3.12+, `uv`
- Docker (recommended for PostgreSQL, Redis, MinIO)

### 1. Start Infrastructure (Docker)
```bash
cd lms-BE
docker compose up -d
```

### 2. Backend Setup
```bash
cd lms-BE
uv venv && source .venv/bin/activate
uv sync
cp .env.example .env   # fill in your credentials
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs

### 3. Frontend Setup
```bash
cd lms-FE
npm install
cp .env.example .env
npm run dev
```
App: http://localhost:5173

---

## 🤝 Contribution Guidelines
1. Run `npm run build` and `npx react-doctor@latest .` — both must pass with zero errors before opening a PR.
2. All SQLAlchemy model changes require an Alembic migration: `uv run alembic revision --autogenerate -m "description"`.
3. Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, etc.
## ✨ Recent Highlights

- **Course Community Portal**: A real-time discussion system integrated into both Teacher and Student dashboards, supporting threaded replies, post pinning, and type-based filtering (Announcements, Discussions, Questions).
- **UI Standardization**: Refactored the internal component library to enforce consistent button variants and loading states across all new features.
- **Enhanced Data Integrity**: Optimized backend eager loading and query normalization to ensure author identities and resource relationships are populated with zero additional roundtrips.
- **Teacher Evaluation Dashboard**: A centralized, paginated interface for grading File, MCQ, and TEXT submissions across all assigned courses.
- **Drag-and-Drop Questionnaire**: Interactive assignment creator allowing teachers to reorder questions and MCQ options via a premium DND interface.
- **Unified Submissions**: Standardized API and Frontend components for handling diverse assessment types (MCQ, TEXT, FILE) with consistent feedback loops.
