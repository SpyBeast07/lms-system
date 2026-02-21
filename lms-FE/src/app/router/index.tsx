import { createRouter, createRoute, createRootRoute, Navigate, redirect } from '@tanstack/react-router';
import { ToastRenderer } from '../../shared/components/ui/ToastRenderer';
import { Outlet } from '@tanstack/react-router';
import { LoginForm } from '../../features/auth/components/LoginForm';
import { useAuthStore } from '../store/authStore';
import { decodeToken } from '../../shared/utils/jwt';
import { AdminLayout } from '../../features/admin/layout/AdminLayout';
import { AdminDashboard } from '../../features/admin/pages/AdminDashboard';
import { ProtectedRoute } from './ProtectedRoute';
import { UsersPage } from '../../features/users/pages/UsersPage';
import { CoursesPage } from '../../features/courses/pages/CoursesPage';
import { CourseDetailPage } from '../../features/courses/pages/CourseDetailPage';
import { EnrollmentsManagementPage } from '../../features/enrollments/pages/EnrollmentsManagementPage';
import { FilesPage } from '../../features/files/pages/FilesPage';
import { HealthPage } from '../../features/health/pages/HealthPage';
import { ActivityLogsPage } from '../../features/activityLogs/pages/ActivityLogsPage';
import { SignupPage } from '../../features/signup/pages/SignupPage';
import { AdminSignupRequestsPage } from '../../features/signup/pages/AdminSignupRequestsPage';

// Teacher Imports
import { TeacherLayout } from '../../features/teacher/layout/TeacherLayout';
import { TeacherCoursesPage } from '../../features/teacher/pages/TeacherCoursesPage';
import { UploadNotesPage } from '../../features/materials/pages/UploadNotesPage';
import { AssignmentForm } from '../../features/materials/pages/AssignmentForm';
import { ManageMaterialsPage } from '../../features/materials/pages/ManageMaterialsPage';
import { TeacherEvaluationPage } from '../../features/teacher/pages/TeacherEvaluationPage';

// Student Imports
import { StudentLayout } from '../../features/student/layout/StudentLayout';
import { StudentCoursesPage } from '../../features/student/pages/StudentCoursesPage';
import { CourseMaterialsPage } from '../../features/student/pages/CourseMaterialsPage';
import { StudentCoursePage } from '../../features/student/pages/StudentCoursePage';
import { AssignmentDetailPage } from '../../features/student/pages/AssignmentDetailPage';
import { AssignmentSubmissionPage } from '../../features/student/pages/AssignmentSubmissionPage';
import { StudentSubmissionsPage } from '../../features/submissions/pages/StudentSubmissionsPage';

import { ErrorComponent } from '../../shared/components/ui/ErrorComponent';

// 1. Root Route
const rootRoute = createRootRoute({
    component: function RootRouteComponent() {
        return (
            <div className="min-h-screen bg-slate-50 w-full font-sans text-slate-900">
                <Outlet />
                <ToastRenderer />
            </div>
        );
    },
    errorComponent: ({ error, reset }) => (
        <div className="p-8">
            <ErrorComponent error={error} reset={reset} />
        </div>
    ),
});

// 2. Login Route
const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    beforeLoad: () => {
        if (useAuthStore.getState().isAuthenticated) {
            throw redirect({ to: '/' });
        }
    },
    component: function LoginRouteComponent() {
        return (
            <div className="flex h-screen w-full items-center justify-center p-4">
                <LoginForm />
            </div>
        );
    },
});

// 2b. Signup Route (public)
const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    beforeLoad: () => {
        if (useAuthStore.getState().isAuthenticated) {
            throw redirect({ to: '/' });
        }
    },
    component: SignupPage,
});

// 3. Index/Dashboard Route (Protected Example)
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
        const { isAuthenticated, accessToken } = useAuthStore.getState();

        if (!isAuthenticated || !accessToken) {
            throw redirect({ to: '/login' });
        }

        const payload = decodeToken(accessToken);
        if (payload?.role === 'super_admin') {
            throw redirect({ to: '/admin/dashboard' });
        } else if (payload?.role === 'teacher') {
            throw redirect({ to: '/teacher/courses' });
        } else if (payload?.role === 'student') {
            throw redirect({ to: '/student/courses' });
        }
    },
    component: function DashboardRouteComponent() {
        const { accessToken, logout } = useAuthStore();
        const payload = decodeToken(accessToken);

        // Fallbacks just in case layout renders before bounce triggers
        const userName = payload?.name || "Unknown User";
        const userRole = payload?.role || "Unknown Role";

        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">LMS Dashboard</h1>
                        <p className="text-slate-500 mt-1">Welcome back, {userName}! Role: <span className="font-semibold text-indigo-600">{userRole}</span></p>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }
});

// 4. Admin Routing Tree
const adminRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin',
    component: function AdminRouteComponent() {
        return (
            <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminLayout />
            </ProtectedRoute>
        );
    },
    errorComponent: ({ error, reset }) => (
        <AdminLayout>
            <div className="p-8">
                <ErrorComponent error={error} reset={reset} />
            </div>
        </AdminLayout>
    ),
});

const adminIndexRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/',
    component: function AdminIndexRouteComponent() {
        return <Navigate to="/admin/dashboard" replace />;
    }
});

const adminDashboardRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/dashboard',
    component: AdminDashboard,
});

const adminUsersRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/users',
    component: UsersPage,
});

const adminCoursesRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/courses',
    component: CoursesPage,
});

const adminCourseDetailRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/courses/$courseId',
    component: CourseDetailPage,
});

const adminEnrollmentsRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/enrollments',
    component: EnrollmentsManagementPage,
});

const adminFilesRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/files',
    component: FilesPage,
});

const adminHealthRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/health',
    component: HealthPage,
});

const adminActivityLogsRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/activity-logs',
    component: ActivityLogsPage,
});

const adminSignupRequestsRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/signup-requests',
    component: AdminSignupRequestsPage,
});

// 5. Teacher Routing Tree
const teacherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/teacher',
    component: function TeacherRouteComponent() {
        return (
            <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
            </ProtectedRoute>
        );
    },
    errorComponent: ({ error, reset }) => (
        <TeacherLayout>
            <div className="p-8">
                <ErrorComponent error={error} reset={reset} />
            </div>
        </TeacherLayout>
    ),
});

const teacherIndexRoute = createRoute({
    getParentRoute: () => teacherRoute,
    path: '/',
    component: function TeacherIndexRouteComponent() {
        return <Navigate to="/teacher/courses" replace />;
    }
});

const teacherCoursesRoute = createRoute({
    getParentRoute: () => teacherRoute,
    path: '/courses',
    component: TeacherCoursesPage,
});

const teacherUploadRoute = createRoute({
    getParentRoute: () => teacherRoute,
    path: '/upload-notes',
    component: UploadNotesPage,
});

const teacherAssignmentRoute = createRoute({
    getParentRoute: () => teacherRoute,
    path: '/create-assignment',
    component: AssignmentForm,
});

const teacherManageMaterialsRoute = createRoute({
    getParentRoute: () => teacherRoute,
    path: '/materials',
    component: ManageMaterialsPage,
});

const teacherEvaluationRoute = createRoute({
    getParentRoute: () => teacherRoute,
    path: '/evaluations',
    component: TeacherEvaluationPage,
});

// 6. Student Routing Tree
const studentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/student',
    component: function StudentRouteComponent() {
        return (
            <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
            </ProtectedRoute>
        );
    },
    errorComponent: ({ error, reset }) => (
        <StudentLayout>
            <div className="p-8">
                <ErrorComponent error={error} reset={reset} />
            </div>
        </StudentLayout>
    ),
});

const studentIndexRoute = createRoute({
    getParentRoute: () => studentRoute,
    path: '/',
    component: function StudentIndexRouteComponent() {
        return <Navigate to="/student/courses" replace />;
    }
});

const studentCoursesRoute = createRoute({
    getParentRoute: () => studentRoute,
    path: '/courses',
    component: StudentCoursesPage,
});

const studentCourseDetailRoute = createRoute({
    getParentRoute: () => studentRoute,
    path: '/courses/$courseId',
    validateSearch: (search: Record<string, unknown>): { tab?: 'notes' | 'assignments' | 'practice' } => {
        return {
            tab: (search.tab as any) || 'notes',
        }
    },
    component: StudentCoursePage,
});

const studentAssignmentDetailRoute = createRoute({
    getParentRoute: () => studentRoute,
    path: '/courses/$courseId/assignments/$assignmentId',
    component: AssignmentDetailPage,
});

const studentMaterialsRoute = createRoute({
    getParentRoute: () => studentRoute,
    path: '/materials',
    component: CourseMaterialsPage,
});

const studentSubmissionNewRoute = createRoute({
    getParentRoute: () => studentRoute,
    path: '/submissions/new',
    component: AssignmentSubmissionPage,
});

const studentSubmissionsListRoute = createRoute({
    getParentRoute: () => studentRoute,
    path: '/submissions',
    component: StudentSubmissionsPage,
});


// 7. Build Tree
const routeTree = rootRoute.addChildren([
    loginRoute,
    signupRoute,
    indexRoute,
    adminRoute.addChildren([
        adminIndexRoute,
        adminDashboardRoute,
        adminUsersRoute,
        adminCoursesRoute,
        adminCourseDetailRoute,
        adminEnrollmentsRoute,
        adminFilesRoute,
        adminHealthRoute,
        adminActivityLogsRoute,
        adminSignupRequestsRoute,
    ]),
    teacherRoute.addChildren([
        teacherIndexRoute,
        teacherCoursesRoute,
        teacherUploadRoute,
        teacherAssignmentRoute,
        teacherManageMaterialsRoute,
        teacherEvaluationRoute
    ]),
    studentRoute.addChildren([
        studentIndexRoute,
        studentCoursesRoute,
        studentCourseDetailRoute,
        studentAssignmentDetailRoute,
        studentMaterialsRoute,
        studentSubmissionNewRoute,
        studentSubmissionsListRoute
    ])

]);

// 8. Create Router Instance
export const router = createRouter({ routeTree });

// 6. Register for strict type safety across the app
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
