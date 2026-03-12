import React, { type ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { setupInterceptors } from '../../shared/api/interceptors';
import { api } from '../../shared/api/axios';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isInitializing, setIsInitializing] = useState(true);
    const { accessToken, refreshToken, setTokens, logout } = useAuthStore();

    useEffect(() => {
        // 1. Immediately inject the interceptor logic into the global axios instance
        setupInterceptors(api);

        // 2. Hydrate/Check existing token state on application boot
        const initializeAuth = async () => {
            try {
                if (!accessToken && refreshToken) {
                    // Edge case where memory is cleared but persistent refresh exists
                    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
                    setTokens(response.data.access_token, response.data.refresh_token);
                } else if (!accessToken && !refreshToken) {
                    // Purge anything anomalous
                    logout();
                }
            } catch (error) {
                console.error('Failed to initialize auth state via refresh token', error);
                logout();
            } finally {
                setIsInitializing(false);
            }
        };

        initializeAuth();
    }, [accessToken, refreshToken, setTokens, logout]);

    if (isInitializing) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-500 font-medium">Initializing Application...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
