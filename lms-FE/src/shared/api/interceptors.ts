import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../app/store/authStore';
import { api } from './axios'; // The same instance to use for the standard token refresh

// Global Mutex for Refresh Token Race Conditions
let refreshPromise: Promise<string> | null = null;

// Shared logic to inject tokens into request
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

// Setup interceptors for an axios instance
export const setupInterceptors = (axiosInstance: AxiosInstance) => {

    // Request Interceptor
    axiosInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));

    // Response Interceptor
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

            // When a 401 is hit AND it hasn't been retried AND it isn't the refresh endpoint itself
            if (error.response?.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
                originalRequest._retry = true;
                const { refreshToken, setTokens, logout } = useAuthStore.getState();

                if (!refreshToken) {
                    logout();
                    return Promise.reject(error);
                }

                try {
                    // Lock check! If no other API call is currently refreshing, WE start the refresh.
                    if (!refreshPromise) {
                        refreshPromise = api.post('/auth/refresh', { refresh_token: refreshToken })
                            .then((res: any) => {
                                setTokens(res.data.access_token, res.data.refresh_token);
                                return res.data.access_token;
                            })
                            .catch((refreshError: any) => {
                                logout();
                                throw refreshError;
                            })
                            .finally(() => {
                                // ALWAYS unlock the mutex when done, success or fail
                                refreshPromise = null;
                            });
                    }

                    // Await the active refresh promise (either the one we just made, or the ongoing one)
                    const newAccessToken = await refreshPromise;

                    // Re-try the original failing request directly using the strictly fresh token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                    return axiosInstance(originalRequest);

                } catch (refreshLockError) {
                    // The underlying refresh failed, which means this request failed.
                    return Promise.reject(refreshLockError);
                }
            }
            // Standard generic 400s, 500s or already-retried 401s
            return Promise.reject(error);
        }
    );
};
