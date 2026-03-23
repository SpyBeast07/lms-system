# LMS Frontend — React

The frontend layer of the LMS System. A type-safe, feature-driven React application with **role-separated dashboards**, **school-scoped data fetching**, and a strict no-stale-state policy on session transitions.

---

## 🛠️ Technologies

| Concern | Library |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Routing | TanStack Router (type-safe) |
| Data Fetching | TanStack Query (React Query) |
| Global State | Zustand (auth session + UI flags only) |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| Styling | TailwindCSS |

---

## 📂 Frontend Structure

```text
lms-FE/src/
├── app/
│   ├── router/
│   │   ├── index.tsx          # All route definitions (role-separated trees)
│   │   └── ProtectedRoute.tsx # Role-guard wrapper component
│   └── store/
│       ├── authStore.ts       # JWT token + role, Zustand
│       └── toastStore.ts      # Toast notification queue, Zustand
│
├── shared/
│   ├── api/
│   │   ├── axios.ts           # Axios base instance (baseURL = '/api' via Caddy proxy, or localhost:8000 for local dev)
│   │   └── interceptors.ts    # Auto-attach Bearer token, refresh on 401
│   ├── components/            # Reusable UI: Button, Table, Modal, Pagination, Skeleton
│   ├── types/                 # Shared TypeScript types (PaginatedResponse, etc.)
│   └── utils/                 # JWT decode, toast helpers, query helpers
│
└── features/
    ├── admin/                 # Super admin dashboard — Schools & global users only
    ├── principal/             # Principal dashboard — Courses, teachers, files, enrollments
    ├── teacher/               # Teacher dashboard — Materials, assignments, grading
    ├── student/               # Student dashboard — Courses, materials, submissions
    ├── schools/               # School management UI (admin-only)
    ├── files/                 # File storage page (principal-only, school-scoped)
    ├── auth/                  # Login, password change requests, password modal
    ├── signup/                # Public signup form + admin/principal approval page
    ├── courses/               # Course CRUD, soft/hard delete, Community Portal
    ├── enrollments/           # Teacher & student course assignment
    ├── materials/             # Upload notes, create assignments, manage materials (teacher)
    ├── submissions/           # Student submissions + teacher grading
    ├── notifications/         # Real-time notification bell + dropdown
    ├── activityLogs/          # System audit log viewer
    ├── ai/                    # AI course content generation hook
    └── health/                # System health check page (admin-only)
```

Each feature contains:
```
feature/
├── api.ts        # Axios endpoint calls
├── hooks/        # TanStack Query (useQuery, useMutation) wrappers
├── schemas.ts    # Zod types
├── services.ts   # Optional service layer between api.ts and hooks
├── components/   # Feature-specific components
└── pages/        # Full-page route views
```

---

## 🐳 Running with Docker (Recommended)

The frontend is part of the full Docker Compose stack. From the repository root:

```bash
docker compose up -d
```

The frontend is built as a production bundle (`npm run build`) and served via `vite preview` inside the container. It is accessible through the Caddy reverse proxy at `http://localhost`.


---

## 🌐 API Configuration (Caddy Proxy)

When running with Docker, the frontend uses **relative API paths** (no hardcoded backend URL):

```typescript
// src/shared/api/axios.ts
export const api = axios.create({
    baseURL: '/api',  // Caddy routes this to the FastAPI backend
});
```

All API calls go to `/api/...`, which Caddy proxies to the backend container.


> **Local dev (without Docker):** Change `baseURL` to `'http://localhost:8000'` in `src/shared/api/axios.ts`.

---

## 🗺️ Routing & Dashboard Separation

Routes are split into four protected trees, each guarded by `ProtectedRoute` which checks `allowedRoles`:

### `/admin/*` — Super Admin Dashboard
Accessible only to `super_admin`. Manages:
- **Schools Management** (`/admin/schools`) — create, update, set subscription windows
- **Users** (`/admin/users`) — view/create/delete super_admins and principals
- **System Health** (`/admin/health`)
- **Activity Logs** (`/admin/activity-logs`)
- **Signup Requests** (`/admin/signup-requests`)
- **Password Requests** (`/admin/password-requests`)

> ⚠️ The **File Storage page is not available in the admin dashboard**. It is only accessible to principals.

### `/principal/*` — Principal Dashboard
Accessible only to `principal`. School-scoped to the principal's assigned school:
- **Users** — manages teachers within the school
- **Courses** — create, view, soft-delete, restore
- **Teacher Review** — inspect teacher performance
- **Enrollments** — manage course assignments
- **File Storage** (`/principal/files`) — upload/view/delete files scoped to the school
- **Signup Requests** — approve or reject teacher/student signups
- **Password Requests** — approve password change requests
- **Activity Logs**

### `/teacher/*` — Teacher Dashboard
- **Evaluations Dashboard**: A centralized table for grading File, MCQ, and TEXT submissions across all courses.
- **Assignment Creator**: Dynamic, drag-and-drop questionnaire builder with support for multiple reference materials (files/links).
- **Submissions & Grading**: Evaluate student assessments directly in the browser with feedback and auto-calculated scores.
- **Course Materials**: Upload notes and manage assignment settings.
- **Community Portal**: Engage with students via course-specific feeds, pin announcements, and answer technical questions.

### `/student/*` — Student Dashboard
- **Community Hub**: Access course discussions to collaborate with peers and teachers.
- Browse enrolled courses, view learning materials
- Submit assignments and track submission history

---

## 🏢 School-Scoped Data Handling

All data-fetching hooks automatically scope to the authenticated user's school. This is enforced at the **backend API level** — the frontend does not need to pass `school_id` explicitly in most queries, as the backend extracts it from the JWT.

**Key patterns:**
- `useFilesQuery()` → lists only files belonging to the logged-in principal's school
- `useCoursesQuery()` → returns only courses in the principal's school
- `useUsersQuery()` → returns only users within role → school boundary

The auth store (`authStore.ts`) decodes the JWT on login and stores `role` and `school_id` locally. This is used to:
- Initialize the correct role-specific route redirect on login
- Conditionally show UI elements (e.g., Hard Delete button visible to principal/super_admin only)
- Build `roleOptions` in the user creation form

---

## 🔐 Auth Flow

1. User submits credentials → `POST /auth/login`.
2. `access_token` is stored in Zustand `authStore`. JWT is decoded to extract `role`, `school_id`, `name`.
3. TanStack Router's `beforeLoad` on the index route inspects the role and redirects the user to their appropriate dashboard (`/admin/dashboard`, `/principal/dashboard`, etc.).
4. Axios request interceptor attaches `Authorization: Bearer <token>` automatically. On 401, it calls `POST /auth/refresh` and retries.
5. On logout, **all TanStack Query caches are fully purged** to prevent stale data from leaking across sessions.
6. **Google OAuth**: Integrated Single Sign-On allows users to log in or register via their Google accounts, complete with dedicated callback handling that securely pre-fills session forms.

---

## 📋 Signup Flow

Principals, teachers, and students register via the public `/signup` page:
- **Google OAuth**: Users can opt to register via Google SSO, securely pre-filling their details to streamline the signup and approval workflow.
- Principals may optionally select a school from the public school list.
- Teachers and students must select a school.
- On submission, a `SignupRequest` is created in `pending` state.
- The appropriate approver (super_admin for principals, principal for teachers/students) approves or rejects via the Signup Requests page.

---

## 👤 User Creation (Admin)

When a super_admin creates a user with **role = Principal**, an animated **"Assign School"** dropdown appears (populated from the public schools API). This immediately associates the new principal with a school, so they can start managing it without going through the signup flow.

---

## 🚀 Getting Started

### Requirements
- Node.js v20+
- npm

### Install & Run
```bash
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:8000
npm run dev
```
App: http://localhost:5173

---

## 🔍 Code Quality

Before pushing any changes, ensure there are no red lines in `vite.config.ts` or `tsconfig.node.json`. The `allowedHosts` must be correctly typed and the configuration must be valid.

**Testing public access:** Ensure your public hostname is in `preview.allowedHosts` for Cloudflare Tunnel to work.

## 💎 UI/UX Standards

- **Exact Route Matching**: Sidebar active states utilize exact path matching to prevent overlapping highlights during nested navigation.
- **Event Integrity**: Interactive elements (like Download buttons) implement strict event propagation control to ensure zero accidental parent-triggering.
- **Interactive Reordering**: Sortable lists use `@dnd-kit` with optimized collision detection and smooth animations.
- **Automated Flow & Review**: Students are automatically redirected to the course dashboard upon completing their final assignment attempt, reducing friction. Moreover, robust UI enables students to easily review their previous assignment submission attempts.
- **Standardized UI Components**: Enforced a project-wide `Button` component with pre-defined variants (`primary`, `success`, `warning`, `ghost`, etc.) to ensure color consistency and predictable interaction feedback.
- **State-Aware Navigation**: Implemented automatic clearing of active discussion threads and form states when transitioning between course contexts in the community portal.
- **Role-Aware Fetching**: Optimized enrollment hooks to bypass redundant/unauthorized metadata requests for teacher roles, eliminating console spam.
