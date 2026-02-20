# Learning Management System (LMS)

Welcome to the LMS System repository. This project is a comprehensive, modern, and robust educational platform designed to streamline course management, student enrollment, and administration for enterprises and educational institutions.

## 📂 Project Overview

The system is built on an enterprise-grade stack, fully separated into backend and frontend components.

- **[Backend (lms-BE)](./lms-BE/README.md)**: A high-performance REST API built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy 2.0 (Async)**. Employs Domain-Driven Design (DDD), Role-Based Access Control (RBAC), JWT authentication, and Soft Delete mechanisms.
- **[Frontend (lms-FE)](./lms-FE/README.md)**: A modern, responsive web application built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. Provides distinct, highly tailored portal experiences for Students, Teachers, and Administrators.

## ✨ Core System Features

- **Role-Based Portals**: Dedicated experiences with specific feature sets for **Students**, **Teachers**, **Principals**, and **Super Admins**.
- **Course & Material Management**: Complete lifecycle management of courses, notes, and assignments. 
- **Presigned File Uploads**: Secure document management utilizing short-lived presigned URLs to an S3-compatible blob storage (MinIO/AWS S3).
- **Soft Deletes**: Active data preservation—deleted users and courses are safely archived with restore capabilities, rather than hard deleted.
- **Real-Time Health Monitoring**: Built-in backend diagnostics streamed directly to the Admin portal for server and database connectivity checks.

## 🚀 Quick Start Guide

To get the full system up and running locally, you need to spin up both the Backend and Frontend servers.

### 1. Backend Setup

Navigate to the `lms-BE` directory and follow the in-depth instructions in the **[Backend README](./lms-BE/README.md)**.

1. Create a Python 3.12+ virtual environment (using `uv` is highly recommended for speed).
2. Install Python dependencies (`uv pip install -r requirements.txt`).
3. Deploy the PostgreSQL instance (typically via Docker).
4. Run Alembic migrations to build the schema (`uv run alembic upgrade head`).
5. Start the FastAPI development server (`uv run uvicorn app.main:app --reload`). The API will be available at `http://127.0.0.1:8000`.

### 2. Frontend Setup

Navigate to the `lms-FE` directory and follow the instructions in the **[Frontend README](./lms-FE/README.md)**.

1. Ensure Node.js (v18+) is installed.
2. Install Javascript dependencies (`npm install`).
3. Start the Vite development server (`npm run dev`).
4. Access the application in your browser at `http://localhost:5173`.

## 🛠 Key Technologies

| Category | Backend (lms-BE) | Frontend (lms-FE) |
|----------|-----------------|------------------|
| **Core Language** | Python 3.12+ | TypeScript 5+ |
| **Framework** | FastAPI | React 19 + Vite |
| **Styling** | N/A | Tailwind CSS |
| **Database/ORM** | PostgreSQL + SQLAlchemy 2.0 | N/A |
| **State/Data** | N/A | Zustand + TanStack Query |
| **Auth** | JWT + Argon2 | JWT (HttpOnly + LocalStorage) |

## 🤝 Contribution

Please refer to the specific README files inside `/lms-FE` and `/lms-BE` for localized development guidelines, architectural patterns, and contribution workflows. This project is proprietary and confidential.
