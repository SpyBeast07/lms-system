# LMS System

A comprehensive, scalable, and modern Learning Management System (LMS) designed for educational institutions to manage courses, users, materials, and evaluations effectively. The platform supports multiple roles including Super Admin, Admin, Teacher, and Student.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Secure access for Super Admins, Admins, Principals, Teachers, and Students with strictly enforced role hierarchies.
- **Principal Dashboard & Teacher Review:** Specialized interface for Principals to monitor teacher activities, curriculum materials, and grading performance nested by course.
- **Course & User Management:** Comprehensive administration for courses, enrolments, and user profiles, including "Hard Delete" capabilities for Super Admins.
- **Learning Materials & Assignments:** Tools to upload notes, create assignments, accept student submissions, and view course learning statistics.
- **Admin Approval Signup Flow:** Secure public registration process requiring administrator/principal verification before granting system access.
- **Data Integrity & Consistency:** Automatic cache invalidation on logout to ensure session isolation across different user roles.
- **Refined Student Navigation:** Intelligent material-to-module deep linking with automatic tab selection and URL state synchronization.
- **Evaluation System:** Grading and feedback mechanisms for teachers to evaluate student work.
- **Real-Time Notifications:** Event-driven notification system for critical updates (e.g., system assignments, grading) with smart deduplication.
- **Activity Logging:** Extensive system-wide audit logging, featuring a personalized Activity Timeline on the Teacher Dashboard.
- **AI-Powered Course Generation:** Leverages local LLMs (Ollama) or external providers (OpenAI/Gemini) to generate professional course descriptions and learning objectives in one click.
- **Optimistic Rendering:** Mutation hooks (like Grading Submissions or marking Notifications read) are designed with Optimistic UI configurations via React Query, instantly rendering updates to the user while syncing over the network in the background.
- **Intelligent Navigation:** Clicking materials redirects students to the specific course detail tab (`?tab=notes` or `?tab=assignments`), maintaining a seamless learning context through URL state.
- **Unified AI Integration:** The AI generation flow is consolidated into a single backend call that populates both course descriptions and learning objectives, providing a seamless "one-click" content creation experience for teachers.
- **Modular Architecture:** Both the frontend and backend group code by features (`/features/auth`, `/features/users`), avoiding cluttered global directories.
- **Production Hardened:** 
  - **Rate Limiting:** Protects critical endpoints using Redis and SlowAPI.
  - **Build Optimization:** Vite-configured chunk splitting and vendor isolation for efficient loading.
  - **Background Cleanup:** Automated APScheduler jobs to prune old data and orphaned MinIO files.
  - **Standardized Responses:** Unified REST API response wrappers to ensure consistent client-side consumption.

## 📄 Documentation
- **AI Integration Guide:** Deep dive into Ollama setup, prompt architecture, and provider switching in [lms-BE/docs/ai_integration.md](file:///Users/kushagra/Documents/Internship%20@Eurobliz/lms-system/lms-BE/docs/ai_integration.md).

## 🛠️ Technology Stack

The project is structured as a monorepo containing a distinct Frontend and Backend:

### Frontend (`/lms-FE`)
- **Core:** [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Routing & State:** [TanStack Router](https://tanstack.com/router), [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query)
- **Styling:** [TailwindCSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)

### Backend (`/lms-BE`)
- **Core:** [FastAPI](https://fastapi.tiangolo.com/), [Python 3.12+](https://www.python.org/)
- **Database (ORM):** [SQLAlchemy (Async)](https://www.sqlalchemy.org/), [PostgreSQL](https://www.postgresql.org/)
- **Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
- **Storage:** [MinIO (S3 Compatible Object Storage)](https://min.io/)
- **Security & Caching:** [Redis](https://redis.io/), [SlowAPI](https://pypi.org/project/slowapi/)
- **Background Jobs:** [APScheduler](https://apscheduler.readthedocs.io/)

## 📂 File Structure

```text
lms-system/
├── lms-BE/                 # Backend FastAPI Application
│   ├── alembic/            # Database Migration Scripts
│   ├── app/                # Main Application Code
│   │   ├── core/           # Config, DB, Storage, Rates, Responses, Setup
│   │   ├── features/       # Domain Modules (Auth, Users, Courses, Submissions, etc.)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── courses/
│   │   │   ├── signup_requests/
│   │   │   ├── ...
│   │   └── main.py         # FastAPI Entry Point
│   ├── requirements.txt    
│   └── .env.example
│
├── lms-FE/                 # Frontend React Application
│   ├── src/                # Main Source Code
│   │   ├── app/            # Global Setup (Router, Store)
│   │   ├── components/     # Reusable UI Base Components
│   │   ├── features/       # Feature/Domain specifically UI Modules
│   │   │   ├── auth/
│   │   │   ├── signup/
│   │   │   ├── teacher/
│   │   │   ├── admin/
│   │   │   ├── ...
│   │   └── main.tsx        # React Entry Point
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🏗️ Getting Started (For Newcomers)

This project requires simultaneous execution of both the Frontend and the Backend, alongside active instances of PostgreSQL, Redis, and MinIO.

### Prerequisites
1. **Node.js (v20+)**: Required for the frontend.
2. **Python (3.12+)**: Required for the backend. `uv` or `pip` as a package manager.
3. **Docker (Optional but Recommended)**: The easiest way to run PostgreSQL, Redis, and MinIO locally.

### 1. Setup Backend
Navigate to the backend directory:
```bash
cd lms-BE
```
Create a virtual environment and install dependencies:
```bash
uv venv
source .venv/bin/activate
uv pip install -r pyproject.toml # or requirements if exported
```
*Note: This project uses `uv` for lightning-fast Python dependency management. You can also use standard `pip`.*

Setup your `.env` file (copy from `.env.example`), ensuring your Database, Redis, and MinIO credentials are correct.
Apply migrations and start the server:
```bash
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```
The API documentation is available at `http://localhost:8000/docs`.

### 2. Setup Frontend
Navigate to the frontend directory:
```bash
cd lms-FE
```
Install NPM dependencies:
```bash
npm install
```
Setup your `.env` file (copy from `.env.example`).
Start the development server:
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

## 📖 Architecture & Design Concept
The LMS System strictly adheres to a **Domain-Driven Modular Architecture**. 
- Both the frontend and backend group code by **features** (`/features/auth`, `/features/users`), avoiding cluttered global directories.
- The **Backend** relies heavily on async I/O. Endpoints act as thin routing wrappers around isolated Service layers using injected Database sessions (`get_db`).
- The **Frontend** leverages `TanStack Query` as the single source of truth for remote state handling, keeping local state management minimal through `Zustand` exclusively for UI flags (e.g. notifications dropdown).

## 🤝 Contribution Guidelines
1. Ensure `react-doctor` scores 100/100 and no TypeScript errors appear on build.
2. Always write Alembic migrations for any SQLAlchemy Database Model changes (`uv run alembic revision --autogenerate -m "msg"`).
3. Adhere to conventional commits (`feat:`, `fix:`, `chore:`, etc.).
