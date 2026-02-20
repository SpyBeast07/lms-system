import { authApi } from './api';
import { useAuthStore } from '../../app/store/authStore';
import type { LoginFormData } from './schemas';

/**
 * Business logic layer. 
 * Orchestrates API calls and interacts with Global State (Zustand).
 */
export const authService = {
    loginService: async (credentials: LoginFormData) => {
        // 1. Call API
        const data = await authApi.login(credentials);

        // 2. Persist to Zustand Store
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);

        return data;
    },

    refreshService: async () => {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token available");

        try {
            const data = await authApi.refresh(refreshToken);
            useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
            return data;
        } catch (error) {
            useAuthStore.getState().logout();
            throw error;
        }
    },

    logoutService: async () => {
        const { refreshToken, logout } = useAuthStore.getState();

        try {
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch (e) {
            console.warn("Backend logout failed, killing local session anyway.");
        } finally {
            // ALWAYS purge the local tokens regardless of server response
            logout();
        }
    }
};
