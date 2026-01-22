# LMS Backend (FastAPI)

A backend system for a **Learning Management System (LMS)** built using **FastAPI**, **PostgreSQL**, **SQLAlchemy**, and **JWT authentication**.

This project implements:
- User management
- Course management
- Teacher–course & student–course mapping
- Learning materials (notes & assignments)
- Secure authentication with **access + refresh tokens**
- Role-based authorization
- Soft delete & restore logic

---

## 🚀 Tech Stack

- **FastAPI** – API framework
- **PostgreSQL** – Database
- **SQLAlchemy ORM**
- **Alembic** – Migrations
- **JWT (python-jose)** – Authentication
- **Argon2 (passlib)** – Password hashing
- **Docker** – Database container
- **uv** – Python package & runtime manager

---

## 📁 Project Structure (High Level)

```
app/
├── api/                # API routes
├── auth/               # Authentication & authorization
├── crud/               # Business logic
├── db/
│   ├── models/         # ORM models
│   ├── session.py
├── schemas/            # Pydantic schemas
├── main.py             # App entry point
alembic/                # Migrations

```
---

## 🐳 Step 1 — Run PostgreSQL using Docker

### Pull & run Postgres container

```bash
docker run --name lms_postgres \
  -e POSTGRES_USER=lms_user \
  -e POSTGRES_PASSWORD=lms_password \
  -e POSTGRES_DB=lms_db \
  -p 5432:5432 \
  -d postgres
```

### **Check container status**

```
docker ps
```

---

## **🗄️ Step 2 — Access the Database**

```
docker exec -it lms_postgres psql -U lms_user -d lms_db
```

Useful commands inside psql:

```
\dt            -- list tables
\d users       -- describe table
SELECT * FROM users;
```

Exit:

```
\q
```

---

## **🐍 Step 3 — Install Dependencies**

### **Using uv (recommended)**

```
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### **Or using pip**

```
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## **🧬 Step 4 — Run Database Migrations**

```
uv run alembic upgrade head
```

This creates all tables in PostgreSQL.

---

## **▶️ Step 5 — Run the Application**

```
uv run uvicorn app.main:app --reload
```

Server will start at:

```
http://127.0.0.1:8000
```

---

## **📖 Swagger API Docs**

Open in browser:

```
http://127.0.0.1:8000/docs
```

Features available in Swagger:

- Login (/auth/login)
- JWT authorization (Authorize button)
- All CRUD APIs
- Refresh token flow

---

## **🔐 Authentication Flow (Quick)**

1. **Login** → /auth/login
    - Returns access_token + refresh_token
2. Click **Authorize** in Swagger
    - Use: Bearer <access_token>
3. Call protected APIs
4. When access token expires → /auth/refresh

---

## **👥 Roles Supported**

- super_admin
- principal
- teacher
- student

Role-based access is enforced at route level.

---

## **🧹 Soft Delete Logic**

- Records are **never removed immediately**
- is_deleted = true
- Can be restored
- CRUD layer always filters deleted records

---

## **🧪 Health Check**

```
GET /health
```

---

## **✅ Status**

- Authentication & authorization implemented
- Refresh token rotation implemented
- Secure session handling
- Ready for further features (assignments, submissions, evaluation)

---

## **🛠️ Run Again (Quick Commands)**

```
docker start lms_postgres
uv run uvicorn app.main:app --reload
```
