# LMS Frontend System

A modern, highly responsive Learning Management System (LMS) web client built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## 🚀 Overview

This frontend application utilizes a cutting-edge tech stack to provide an exceptional, highly interactive experience. It features strictly isolated portal views tailored specifically to **Students**, **Teachers**, and **Administrators**.

### Key Features

- **Role-Based Portals**:
  - **Admin Portal**: Complete oversight over Users, Courses, Enrollments, Data Archiving (Soft Deletes / Restore), and comprehensive System Health monitoring.
  - **Teacher Portal**: Create and manage Courses, safely publish Notes/Files to S3 storage, define Assignments, and track Student progression.
  - **Student Portal**: View Enrolled Courses, securely download learning Materials, and submit completed Assignments via drag-and-drop file staging.
- **State-of-the-Art Data Synchronization**: Robust server-state management using **TanStack React Query**, keeping local UI views perfectly in-sync with the backend.
- **Form Handling & Validation**: Type-safe structural forms built seamlessly on top of **React Hook Form** + **Zod**.
- **Data Preservation UI**: The Admin Course and User management tables logically separate **Active** versus **Deleted** entities, exposing one-click Restore actions to reverse accidental deletions.

---

## 🛠 Tech Stack

- **Core**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Global State)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Routing**: [TanStack Router](https://tanstack.com/router/latest)
- **Forms & Validation**: React Hook Form + Zod
- **Networking**: Axios

---

## ⚡️ Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Installation

Clone the repository, navigate into `lms-FE`, and install the required dependencies.

```bash
cd lms-FE
npm install
```

### 2. Development

Start the Vite development server with Hot Module Replacement (HMR).

```bash
npm run dev
```

The React application will safely boot and attach to `http://localhost:5173`.

### 3. Build for Production

Compile and strictly type-check the application for production deployment.

```bash
npm run build
```

Preview the production bundle locally:

```bash
npm run preview
```

---

## 📁 Project Structure

The project inherently relies on a **Feature-Sliced Design** to keep logical domains completely isolated.

```text
src/
├── app/            # Global application bindings (Store, QueryClient)
├── assets/         # Static global assets
├── features/       # Feature-sliced domains (auth, courses, health, materials, users)
│   ├── [feature]/
│   │   ├── components/ # Localized UI components
│   │   ├── hooks/      # Localized React Query / Zustand hooks
│   │   ├── pages/      # Page-level route views
│   │   ├── schemas.ts  # Zod validations & TypeScript interfaces
│   │   └── services.ts # Axios networking wrappers
├── shared/         # Global shared bindings
│   ├── components/ # Core UI component library (Button, Table, Modals)
│   ├── utils/      # Generic utility helpers
└── main.tsx        # React DOM Entry point
```

---

## ✅ Development Guidelines

- **Tailwind Strictness**: Use Tailwind CSS utility classes exclusively for styling. Do not write vanilla CSS unless building complex animations.
- **Data Fetching**: Every API request must be tightly wrapped in a React Query hook inside the `[feature]/hooks/` directory. Direct API calls from inside components are strictly forbidden.
- **Accessibility (a11y)**: Label HTML structures securely, map every `htmlFor` to corresponding input `id` attributes, and heavily favor semantic HTML. 
- **Typesafety**: Never use `any`. Explicitly build TypeScript interfaces relying heavily upon Zod inferred types.

---

## 📄 License
This project is proprietary and confidential.
