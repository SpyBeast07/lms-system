# LMS System

A multi-tenant, school-isolated Learning Management System (LMS) for educational institutions. The system enforces **school-based data isolation**, **subscription-gated access**, and a strict **role hierarchy** across all operations.

---

## 🏗️ Architecture Overview

This project is deployed using a modern, distributed architecture:

| Component | Platform | URL |
|---|---|---|
| `caddy` | Reverse proxy | http://localhost (port 80) |
| `backend` | FastAPI API server | via Caddy (`/api/*`) |
| `frontend` | Vite preview server | via Caddy (`/*`) |
| `postgres` | PostgreSQL database | localhost:5432 |
| `redis` | Cache + rate limiter | localhost:6379 |
| `minio` | Object storage | localhost:9000 / 9001 |

> ⚠️ The `backend` and `frontend` ports are **not exposed directly** to the host. All traffic goes through Caddy on port 80.


### Caddy Reverse Proxy

Caddy (`Caddyfile` in the root directory) handles:
- **HTTP on `:80`** — Optimized for Cloudflare Tunnel handshakes.
- **`/api/*`** — proxied to the FastAPI backend (with `/api` prefix stripped).
- **`/*`** — proxied to the Vite frontend.

> [!NOTE]
> For local development with tunnel, Caddy is configured to use HTTP to simplify the setup with `cloudflared`.


### Access Points

| URL | Description |
|---|---|
| `http://localhost` | Frontend App |
| `http://localhost/api/docs` | Backend Swagger UI |
| `http://localhost/api/redoc` | Backend ReDoc |
| `http://localhost:9001` | MinIO Console |


---

## 🔐 Default Super Admin

A default super admin is **automatically seeded** on every fresh database initialization:

| Field | Value |
|---|---|
| Name | Bade Sahab |
| Email | admin@example.com |
| Password | admin123 |
| Role | super_admin |
| School | None (system-wide access) |

> The super admin is not tied to any school and has unrestricted access to all system resources.

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
- **Core:** React 18 + TypeScript + Vite
- **Routing:** TanStack Router (type-safe)
- **Data Fetching:** TanStack Query (React Query)
- **Styling:** TailwindCSS
- **State:** Zustand

### Backend (`/lms-BE`)
- **Framework:** FastAPI (Python 3.12)
- **ORM:** SQLAlchemy (Async) + PostgreSQL (Neon)
- **Object Storage:** Cloudflare R2 (Boto3/S3 Client)
- **Cache / Rate Limiting:** Redis (Upstash) + SlowAPI
- **Background Jobs:** APScheduler

---

## 🐳 Docker Setup (Local Development)

For local development, we use Docker Compose to orchestrate the environment.

```bash
docker compose up -d --build
```
lms-system/
├── Caddyfile                 # Caddy reverse proxy config (HTTPS + routing)
├── docker-compose.yml        # Full stack orchestration
├── lms-BE/                   # FastAPI Backend
│   ├── alembic/              # DB migration scripts
│   ├── app/
│   │   ├── core/             # Config, DB, Storage, SchoolGuard, Rate limiter, Seeder
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
│   ├── vite.config.ts        # Vite config with allowedHosts
│   └── .env.example
├── .gitignore
├── README.md
└── Caddyfile
```

---

## ☁️ Cloudflare Tunnel Setup

To host this system on Cloudflare using a tunnel:

1.  **Configure Tunnel in Dashboard**:
    - **Service Type**: `HTTP`
    - **Service URL**: `http://127.0.0.1:80`
2.  **Vite Configuration**:
    - Ensure your public hostname (e.g., `lms.example.com`) is added to `preview.allowedHosts` in `lms-FE/vite.config.ts`.
3.  **Caddy Configuration**:
    - Caddy is pre-configured to handle traffic on `:80` without mandatory HTTPS redirects to allow the tunnel to connect.


---

## 🚀 Getting Started

The system handles seeding via startup scripts. In production, this is managed during the first deployment.

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `admin123` |
| Role | `super_admin` |

---

## 🏢 School-Based Multitenancy

Every entity in the system is **scoped to a School**. 
- **Database:** Rows are isolated via `school_id`.
- **Storage:** Files are stored in school-prefixed paths in Cloudflare R2.
- **Subscription:** Access is controlled by an active subscription window per school.

---

## 🤝 Contribution Guidelines

1. **Production Tests**: Ensure `npm run build` and `uv sync` pass before opening PRs.
2. **Migrations**: All DB changes must include an Alembic migration.
3. **CORS**: When adding new domains, update `BACKEND_CORS_ORIGINS` in `lms-BE/app/core/config.py`.

---

## ✨ Recent Highlights

- **Dockerized Full Stack**: All services (backend, frontend, postgres, redis, minio, caddy) are containerized and orchestrated via Docker Compose.
- **Improved Tunnel Compatibility**: Caddy and Vite are optimized for Cloudflare Tunnel, ensuring seamless hosting on public domains.
- **Auto-Seeded Super Admin**: A default `super_admin` (`admin@example.com` / `admin123`) is automatically created on every fresh database initialization.
- **Course Community Portal**: A real-time discussion system integrated into both Teacher and Student dashboards, supporting threaded replies, post pinning, and type-based filtering (Announcements, Discussions, Questions).
- **UI Standardization**: Refactored the internal component library to enforce consistent button variants and loading states across all new features.
- **Enhanced Data Integrity**: Optimized backend eager loading and query normalization to ensure author identities and resource relationships are populated with zero additional roundtrips.
- **Teacher Evaluation Dashboard**: A centralized, paginated interface for grading File, MCQ, and TEXT submissions across all assigned courses.
- **Drag-and-Drop Questionnaire**: Interactive assignment creator allowing teachers to reorder questions and MCQ options via a premium DND interface.
- **Unified Submissions**: Standardized API and Frontend components for handling diverse assessment types (MCQ, TEXT, FILE) with consistent feedback loops.
- **Google OAuth Integration**: Native Single Sign-On (SSO) support for seamless user login and signup, featuring dynamically resolved redirect URIs and active proxy header support.
- **Advanced Assessment & Review**: Built-in support for multiple-selection answers in assignments along with a comprehensive interface enabling students to review their previous submission attempts in detail.
