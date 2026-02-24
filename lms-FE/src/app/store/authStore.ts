import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, UserRole } from '../../shared/types/auth';
import { decodeToken } from '../../shared/utils/jwt';
import { queryClient } from '../providers/QueryProvider';

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    userRole: UserRole | null;

    // Actions
    login: (tokens: AuthTokens) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            userRole: null,

            login: (tokens: AuthTokens) => {
                const payload = decodeToken(tokens.access_token);
                set({
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    isAuthenticated: true,
                    userRole: payload?.role || null,
                });
            },

            setTokens: (accessToken, refreshToken) => {
                const payload = decodeToken(accessToken);
                set({
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    userRole: payload?.role || null,
                });
            },

            clearAuth: () => {
                set({
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    userRole: null,
                });
            },

            logout: () => {
                set({
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    userRole: null,
                });

                // Clear TanStack Query cache to prevent stale data between different user sessions
                queryClient.clear();

                // Ensure browser cleanup across tabs if needed
                localStorage.removeItem('auth-store');
            },
        }),
        {
            name: 'auth-store', // key in localStorage
            // CRITICAL: Only persist the cryptographic tokens.
            // Automatically prevents 'userRole' or implicit user identity objects from being saved permanently to disk.
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken
            }),
            // Automatically derive state cleanly strictly on hydration
            onRehydrateStorage: () => (state) => {
                if (state?.accessToken) {
                    const payload = decodeToken(state.accessToken);
                    state.isAuthenticated = true;
                    state.userRole = payload?.role || null;
                }
            }
        }
    )
);
