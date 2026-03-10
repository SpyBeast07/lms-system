import axios from 'axios';

// Base Axios instance
// Use VITE_API_URL from environment or fallback to '/api' for Caddy proxy
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});
