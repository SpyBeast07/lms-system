import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';

// Create a client globally. Hardened for Production:
// - Retries disabled to prevent duplicate state mutations / thundering herd
// - Window Focus refetching disabled to prevent unprompted API spam
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
        },
        mutations: {
            retry: false,
        }
    },
});

export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};
