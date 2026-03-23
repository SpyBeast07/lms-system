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

- **Dockerized Full Stack**: All services (backend, frontend, postgres, redis, minio, caddy) are containerized and orchestrated via Docker Compose with a single `docker compose up -d`.
- **Caddy Reverse Proxy + HTTPS**: Caddy serves as the gateway, routing `/api/*` to FastAPI and `/*` to the frontend — with automatic local TLS certificate provisioning.
- **Auto-Seeded Super Admin**: A default `super_admin` (`admin@example.com` / `admin123`) is automatically created on every fresh database initialization.
- **Course Community Portal**: A real-time discussion system integrated into both Teacher and Student dashboards, supporting threaded replies, post pinning, and type-based filtering (Announcements, Discussions, Questions).
- **UI Standardization**: Refactored the internal component library to enforce consistent button variants and loading states across all new features.
- **Enhanced Data Integrity**: Optimized backend eager loading and query normalization to ensure author identities and resource relationships are populated with zero additional roundtrips.
- **Teacher Evaluation Dashboard**: A centralized, paginated interface for grading File, MCQ, and TEXT submissions across all assigned courses.
- **Drag-and-Drop Questionnaire**: Interactive assignment creator allowing teachers to reorder questions and MCQ options via a premium DND interface.
- **Unified Submissions**: Standardized API and Frontend components for handling diverse assessment types (MCQ, TEXT, FILE) with consistent feedback loops.
- **Google OAuth Integration**: Native Single Sign-On (SSO) support for seamless user login and signup, featuring dynamically resolved redirect URIs and active proxy header support.
- **Advanced Assessment & Review**: Built-in support for multiple-selection answers in assignments along with a comprehensive interface enabling students to review their previous submission attempts in detail.
