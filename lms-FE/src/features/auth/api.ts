import { api } from '../../shared/api/axios';
import type { LoginFormData, TokenResponse } from './schemas';

/**
 * Pure API call layer. No business logic or state mutations here.
 */
export const authApi = {
    login: async (data: LoginFormData): Promise<TokenResponse> => {
        // The backend expects application/x-www-form-urlencoded mapped to username/password
        const formData = new URLSearchParams();
        formData.append('username', data.email);
        formData.append('password', data.password);

        const response = await api.post<TokenResponse>('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return response.data;
    },

    refresh: async (refreshToken: string): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken });
        return response.data;
    },

    logout: async (refreshToken: string): Promise<void> => {
        // Attempt to notify server of logout. Don't throw if it fails (the token is already dead).
        await api.post('/auth/logout', { refresh_token: refreshToken });
    }
};
