import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor to attach access_token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 & automatic token refresh
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Avoid infinite loop if the refresh itself gives a 401
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    // Send request with refresh_token 
                    // Note: using raw axios here to avoid interceptor loop
                    const res = await axios.post(`${API_URL}/auth/refresh`, {
                        refresh_token: refreshToken
                    });

                    if (res.data.access_token) {
                        localStorage.setItem('access_token', res.data.access_token);
                        if (res.data.refresh_token) {
                            localStorage.setItem('refresh_token', res.data.refresh_token);
                        }

                        // Re-attempt original original request with new token
                        originalRequest.headers['Authorization'] = `Bearer ${res.data.access_token}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    // If refresh fails, log the user out
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login'; // Redirect to login
                }
            } else {
                // No refresh token available, force logout
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);
