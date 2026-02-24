# Eurobliz LMS System - Frontend (React)

The frontend layer of the Eurobliz LMS, providing a highly interactive, extremely responsive, and strongly typed user interface for Admins, Teachers, and Students.

## 🛠️ Technologies
- **Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS, Lucide React (Icons)
- **Routing:** TanStack Router (File-based, Type-safe)
- **Data Fetching & Caching:** TanStack Query (React Query)
- **Global State Management:** Zustand
- **Forms & Validation:** React Hook Form, Zod

## 📂 Frontend Structure
The project follows a **Feature-Driven Architecture** to keep the codebase scalable.

```text
lms-FE/
├── src/
│   ├── app/                # Application-wide setup
│   │   ├── router/         # TanStack Router configuration
│   │   └── store/          # Global Zustand stores (e.g. Auth, Notifications)
│   ├── components/         # Reusable, dumb UI elements (Buttons, Inputs, Cards)
│   ├── config/             # Environment variables and API base configs
│   └── features/           # Domain-specific modules representing logical groupings
│       ├── activityLogs/   # System & User-specific activity timelines
│       ├── admin/          # Admin Dashboard & User Management
│       ├── ai/             # Unified Course Content Generation (Axios/React Query)
│       ├── auth/           # Login flows
│       ├── notifications/  # Smart Deduplicating Notifications
│       ├── signup/         # Public registration request & Admin/Principal approval flow
│       ├── student/        # Student Dashboard & Course View
│       ├── submissions/    # File processing & teacher evaluation audit
│       ├── principal/      # Principal Dashboard & Teacher Activity Review
│       └── teacher/        # Course creation, Student Enrollment & Assessment grading
```

Each feature directory optimally contains:
- `api.ts`: Axios endpoint calls.
- `hooks.ts`: React Query wrappers (`useQuery`, `useMutation`).
- `schemas.ts`: Zod validation types.
- `components/`: Feature-specific UI components.
- `pages/`: Full screen route views.

## 🚀 Getting Started

### 1. Requirements
- Node.js (v20+)
- npm

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of the frontend folder:
```ini
VITE_API_URL=http://127.0.0.1:8000
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will be accessible at: [http://localhost:5173](http://localhost:5173).

## 🧠 Architectural Philosophy
- **Server State vs Client State:** We utilize `TanStack Query` for almost everything interacting with the backend API. Global `Zustand` stores are exclusively used for purely localized client states context, such as retaining the authenticated User identity flag and controlling volatile layouts like the Notification Bell count.
- **Type Safety Pipeline:** Utilizing `TanStack Router` mixed with `Zod`, any endpoint payloads are strictly asserted against typing rules before they are even transmitted, drastically reducing runtime crashes.
- **Optimistic Rendering:** Mutation hooks (like Grading Submissions or marking Notifications read) are designed with Optimistic UI configurations via React Query, instantly rendering updates to the user while syncing over the network in the background.
- **Unified AI Integration:** The AI generation flow is consolidated into a single backend call that populates both course descriptions and learning objectives, providing a seamless "one-click" content creation experience for teachers.

## 🔍 Code Quality Control
Ensure you run internal quality checks before pushing changes:
```bash
npx react-doctor@latest .
npm run build
```
Avoid modifying `/components` unnecessarily if a domain-specific layout component can be safely isolated inside `/features/<domain>/components/`.
