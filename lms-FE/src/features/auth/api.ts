import { api } from '../../shared/api/axios';
import type { LoginFormData, TokenResponse, ChangePasswordData, PaginatedPasswordChangeRequests } from './schemas';

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
    },

    requestPasswordChange: async (data: Omit<ChangePasswordData, 'confirm_password'> & { isPublic?: boolean }): Promise<{ detail: string }> => {
        const url = data.isPublic ? '/auth/public-change-password' : '/auth/change-password';
        const response = await api.post<{ detail: string }>(url, data);
        return response.data;
    },

    getPasswordRequests: async (page: number = 1, limit: number = 10, status?: string): Promise<PaginatedPasswordChangeRequests> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (status) params.append('status', status);

        const response = await api.get<PaginatedPasswordChangeRequests>(`/auth/password-requests?${params.toString()}`);
        return response.data;
    },

    approvePasswordRequest: async (requestId: number): Promise<{ detail: string }> => {
        const response = await api.patch<{ detail: string }>(`/auth/password-requests/${requestId}/approve`);
        return response.data;
    },

    rejectPasswordRequest: async (requestId: number): Promise<{ detail: string }> => {
        const response = await api.patch<{ detail: string }>(`/auth/password-requests/${requestId}/reject`);
        return response.data;
    }
};
