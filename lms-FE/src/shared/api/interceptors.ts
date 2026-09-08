import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../app/store/authStore';
import { api } from './axios'; // The same instance to use for the standard token refresh

// Global Mutex for Refresh Token Race Conditions
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token as string);
        }
    });
    failedQueue = [];
};

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
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                            }
                            return axiosInstance(originalRequest);
                        })
                        .catch((err) => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const { refreshToken, setTokens, logout } = useAuthStore.getState();

                if (!refreshToken) {
                    isRefreshing = false;
                    logout();
                    return Promise.reject(error);
                }

                try {
                    const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
                    const newAccessToken = res.data.access_token;

                    setTokens(newAccessToken, res.data.refresh_token);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }

                    processQueue(null, newAccessToken);
                    return axiosInstance(originalRequest);

                } catch (refreshError) {
                    processQueue(refreshError, null);
                    logout();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
            // Standard generic 400s, 500s or already-retried 401s
            return Promise.reject(error);
        }
    );
};
