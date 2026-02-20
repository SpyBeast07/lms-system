import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    roles?: Array<'super_admin' | 'teacher' | 'student'>;
    children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        // User not logged in
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0 && role) {
        if (!roles.includes(role)) {
            // User doesn't have the required role
            // Redirecting to home/dashboard or unauthorized page
            return <Navigate to="/" replace />;
        }
    }

    // Render children if passed directly, otherwise render nested routes
    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
