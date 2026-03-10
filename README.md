# LMS System

A multi-tenant, school-isolated Learning Management System (LMS) for educational institutions. The system enforces **school-based data isolation**, **subscription-gated access**, and a strict **role hierarchy** across all operations.

---

## 🏗️ Architecture Overview

This project is deployed using a modern, distributed architecture:

| Component | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | [lms-system-blush.vercel.app](https://lms-system-blush.vercel.app/) |
| **Backend** | Render | [lms-system-ecuw.onrender.com](https://lms-system-ecuw.onrender.com/) |
| **Database** | Neon (PostgreSQL) | Managed Serverless |
| **Cache** | Upstash (Redis) | Global Serverless |
| **Storage** | Cloudflare R2 | S3-Compatible Object Storage |

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

| Service | Accessible At |
|---|---|
| **Frontend** | `https://localhost` |
| **Backend API** | `https://localhost/api` |
| **Swagger UI** | `https://localhost/api/docs` |

### Caddy Reverse Proxy (Local)
In the local Docker environment, Caddy acts as the gateway:
- Routes `/api/*` to the FastAPI backend.
- Serves the React frontend on all other paths.
- Provides automatic HTTPS on `localhost`.

---

## 🔐 Default Super Admin

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

- **Cloud Migration**: Successfully moved from local MinIO/Redis/Postgres to Cloudflare R2, Upstash, and Neon.
- **Vercel + Render Deployment**: Optimized for zero-prefix routing in production while maintaining `/api` prefix compatibility for local Caddy dev.
- **Multi-Stage Builds**: Optimized backend Docker image for low-memory (512MB) environments like Render.
- **Course Community Portal**: A real-time discussion system integrated into both Teacher and Student dashboards.
- **Unified Evaluation**: Centralized grading for File, MCQ, and TEXT submissions.
