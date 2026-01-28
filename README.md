# LMS Backend System

A robust, enterprise-grade Learning Management System (LMS) backend built with **FastAPI**, designed using **Domain-Driven Design (DDD)** principles and a **Feature-Based Architecture**.

## 🚀 Overview

This backend powers an educational platform supporting Students, Teachers, Principals, and Super Admins. It handles complex workflows including course management, enrollment, authentication, and content delivery with a focus on scalability, maintainability, and security.

### Key Features
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Super Admin, Principal, Teacher, and Student.
- **Secure Authentication**: Implementation of OAuth2 with JWT Access & Refresh Token rotation.
- **Domain-Driven Architecture**: Codebase organized by business domains (Auth, Users, Courses, Enrollments) for better modularity.
- **Service Layer Pattern**: Business logic isolated from API routes for reusability and testing.
- **Soft Delete System**: Data preservation with soft delete and restore capabilities.

---

## � Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High performance, async python)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Authentication**: JWT (JSON Web Tokens) with Argon2 hashing
- **Containerization**: Docker & Docker Compose
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (Blazing fast Python package manager)

---

## � Project Structure

The project follows a **Feature-Based** directory structure, grouping related logic (Routes, Models, Schemas, Services) together.

```
app/
├── core/               # Shared infrastructure (DB connection, Security, Config)
├── features/           # Feature modules
│   ├── auth/           # Authentication (Login, Refresh, Logout)
│   ├── users/          # User management & Roles
│   ├── courses/        # Course creation, Materials, Assignments
│   └── enrollments/    # Student/Teacher Course mappings
└── main.py             # Application entry point
```

### Architectural Pattern
- **Router (Controller)**: Handles HTTP requests/responses. Delegates logic to Service.
- **Service (Business Layer)**: Contains all business logic, validation, and transaction management.
- **Model (Data Layer)**: SQLAlchemy ORM models representing database tables.
- **Schema (DTOs)**: Pydantic models for request/response validation.

---

## ⚡️ Quick Start

### Prerequisites
- Python 3.12+
- Docker & Docker Compose
- `uv` (recommended) or `pip`

### 1. Setup Environment
Clone the repository and create a virtual environment.

```bash
# Install uv (if not installed)
pip install uv

# Create virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt
```

### 2. Configure Database
Start a PostgreSQL container using Docker.

```bash
docker run --name lms_postgres \
  -e POSTGRES_USER=lms_user \
  -e POSTGRES_PASSWORD=lms_password \
  -e POSTGRES_DB=lms_db \
  -p 5432:5432 \
  -d postgres
```

### 3. Run Migrations
Apply database schema changes.

```bash
uv run alembic upgrade head
```

### 4. Start the Server
Run the FastAPI development server.

```bash
uv run uvicorn app.main:app --reload
```

The API will be available at: **http://127.0.0.1:8000**

---

## 📖 API Documentation

FastAPI provides automatic interactive documentation.

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Authentication Workflow
1.  **Login**: `POST /auth/login` with credentials.
2.  **Authorize**: Copy `access_token` and click **Authorize** in Swagger UI (enter `Bearer <token>`).
3.  **Use API**: Authenticated endpoints can now be accessed.
4.  **Refresh**: When access token expires, use `POST /auth/refresh` with your `refresh_token`.

---

## ✅ Development Guidelines

- **New Features**: Create a new directory in `app/features/`.
- **Database Changes**:
    1.  Modify/Add models in the respective feature `models.py`.
    2.  Import the model in `app/core/db_base.py`.
    3.  Run `alembic revision --autogenerate -m "message"`.
    4.  Run `alembic upgrade head`.

---

## � License
This project is proprietary and confidential.
