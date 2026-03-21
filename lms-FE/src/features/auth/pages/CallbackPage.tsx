import React, { useEffect } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { useNavigate } from '@tanstack/react-router';

export const CallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const setTokens = useAuthStore((state) => state.setTokens);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
            // Save tokens to store
            setTokens(accessToken, refreshToken);
            // Redirect to home dashboard
            navigate({ to: '/' });
        } else {
            // Handle failure
            console.error('Missing tokens in callback URL');
            navigate({ to: '/login' });
        }
    }, [setTokens, navigate]);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-slate-600 font-medium">Completing Sign In...</p>
            </div>
        </div>
    );
};
