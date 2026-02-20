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
import { EnrollmentsManagementPage } from '../../features/enrollments/pages/EnrollmentsManagementPage';
import { FilesPage } from '../../features/files/pages/FilesPage';
import { HealthPage } from '../../features/health/pages/HealthPage';

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
});

// 2. Login Route
const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    beforeLoad: () => {
        // If already authenticated, bounce to dashboard
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

// 5. Build Tree
const routeTree = rootRoute.addChildren([
    loginRoute,
    indexRoute,
    adminRoute.addChildren([
        adminIndexRoute,
        adminDashboardRoute,
        adminUsersRoute,
        adminCoursesRoute,
        adminEnrollmentsRoute,
        adminFilesRoute,
        adminHealthRoute
    ])
]);

// 5. Create Router Instance
export const router = createRouter({ routeTree });

// 6. Register for strict type safety across the app
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
