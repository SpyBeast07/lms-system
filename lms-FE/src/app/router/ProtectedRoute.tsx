import React from 'react';
import { Navigate, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { decodeToken } from '../../shared/utils/jwt';

interface ProtectedRouteProps {
    allowedRoles?: Array<'super_admin' | 'principal' | 'student' | 'teacher'>;
    children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
    const { isAuthenticated, accessToken } = useAuthStore();

    if (!isAuthenticated || !accessToken) {
        // Note: TanStack Router navigate component 
        // Usually replacing this with standard redirect inside router `beforeLoad` is preferred, 
        // but building this as a wrapper component for standard rendering.
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        // Cryptographically decode role directly from token rather than memory
        const payload = decodeToken(accessToken);

        if (!payload || !payload.role || !allowedRoles.includes(payload.role)) {
            // Unauthorized role -> bounce them to generic dashboard or home
            return <Navigate to="/" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};
