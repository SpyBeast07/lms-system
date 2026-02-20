# LMS Backend System

A robust, enterprise-grade Learning Management System (LMS) backend built natively on top of **FastAPI**, designed strictly via **Domain-Driven Design (DDD)** concepts and a modular **Feature-Based Architecture**.

## 🚀 Overview

This backend acts as the data nerve center, actively powering educational workflows. It manages secure document routing, complex user hierarchies, and extensive access control policies tailored for Students, Teachers, Principals, and Super Admins.

### Key Features

- **Role-Based Access Control (RBAC)**: Fine-grained multi-level permission validation guarding every individual endpoint context.
- **Secure Authentication**: Hardened OAuth2 security mapping JWT Access & Refresh Token rotation.
- **Domain-Driven Architecture**: The codebase is logically sliced by its core business domains (Auth, Users, Courses, Enrollments, Files) preventing module coupling.
- **Service Layer Abstraction**: Business logic is fully stripped out of FastAPI Router definitions and mapped strictly into isolated Service implementations.
- **Soft Delete System**: Advanced data preservation workflows. Database rows are never permanently deleted upon API requests, but merely flagged as `is_deleted`. Safely restores interconnected records seamlessly without cascading structural damage.
- **S3 Presigned Deployments**: Heavy files (documents, videos) bypass the FastAPI lifecycle entirely. The backend acts as an authorization broker, generating secure, short-lived presigned URLs pointing directly to S3/MinIO compatible object stores!
- **System Health Checks**: Natively exposes `[GET] /health` endpoints aggregating real-time CPU performance metrics, database IO readiness, and underlying service availability.

---

## 🛠 Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python)
- **Database**: PostgreSQL (Async via `asyncpg`)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Full AsyncIO support)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Authentication**: JWT (JSON Web Tokens) with Argon2 hashing algorithms
- **Package Management**: [uv](https://github.com/astral-sh/uv) (Ultra-fast Rust-based Python environment manager)

---

## 📁 Project Structure

The structure physically forces Separation of Concerns by adopting a **Feature-Based** directory module implementation.

```text
app/
├── core/               # Shared systemic infrastructure (DB Context, Security, Config Loading)
├── features/           # Sliced Feature Domains
│   ├── auth/           # Login, Token Refresh, Identity verification
│   ├── users/          # User Profiles & Role designation
│   ├── courses/        # Course definitions, Soft deletes, Restore actions
│   ├── materials/      # Assignment logic & Document indexing 
│   ├── enrollments/    # Cross-matrix Student & Teacher table groupings
│   └── files/          # S3 presigned URL brokering and management
└── main.py             # FastAPI App mounting point
```

### Architectural Pattern Definitions
- **Router (Controller)**: Handles HTTP requests/responses, validates payloads via Pydantic, and handles FastAPI Dependency Injection (`Depends()`).
- **Service (Business Layer)**: Handles core business logic, performs deep transactional queries, and executes entity updates. 
- **Model (Data Layer)**: Declarative SQLAlchemy mapped bindings representing literal Database tables.
- **Schema (DTOs)**: Pydantic base models representing exact structures of API input and output payloads.

---

## ⚡️ Quick Start

### Prerequisites
- Python 3.12+
- Docker & Docker Compose (for PostgreSQL proxying)
- `uv` (recommended) or `pip`

### 1. Setup Environment
Clone the repository and instantly map your Python virtual environment using `uv`.

```bash
# Install uv locally
pip install uv

# Initialize and lock the virtual environment
uv venv

# Activate it
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install exact tracked dependencies
uv pip install -r requirements.txt
```

### 2. Configure Database
Launch a pristine PostgreSQL instance bound to port `5432` natively via Docker.

```bash
docker run --name lms_postgres \
  -e POSTGRES_USER=lms_user \
  -e POSTGRES_PASSWORD=lms_password \
  -e POSTGRES_DB=lms_db \
  -p 5432:5432 \
  -d postgres
```

### 3. Run Migrations
Establish the exact mapped relational schemas by triggering Alembic.

```bash
uv run alembic upgrade head
```

### 4. Start the Server
Boot the live HTTP server locally.

```bash
uv run uvicorn app.main:app --reload
```

The underlying REST API will begin strictly accepting connections on **http://127.0.0.1:8000**

---

## 📖 API Documentation

FastAPI natively maps OpenAPI schemas from your Pydantic boundaries.

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc UI**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Authentication Workflow
1.  **Authorize Role**: Send credentials logically to `POST /auth/login`.
2.  **Attach Key**: Append the returned `access_token` securely to Swagger UI via the "Authorize" padlock.
3.  **Execute Operations**: Safely trigger subsequent RBAC endpoints. 
4.  **Refresh Sessions**: Supply your localized `refresh_token` to `POST /auth/refresh` immediately before token expiration to fetch entirely new keypairs.

---

## ✅ Development Guidelines

- **New Features**: Never define global functions. Always bootstrap a distinct localized folder safely inside `app/features/`.
- **Database Migrations**:
    1.  Design/Modify explicitly bounded SQLAlchemy models in your feature's `models.py`.
    2.  Globally import the class context securely in `app/core/db_base.py`.
    3.  Generate the tracking file (`alembic revision --autogenerate -m "message"`).
    4.  Commit the schema upstream (`alembic upgrade head`).

---

## 📄 License
This project is proprietary and confidential.
