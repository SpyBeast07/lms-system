import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api';

const PASSWORD_REQUESTS_KEYS = {
    all: ['passwordRequests'] as const,
    lists: () => [...PASSWORD_REQUESTS_KEYS.all, 'list'] as const,
    list: (filters: { page: number; limit: number; status?: string }) =>
        [...PASSWORD_REQUESTS_KEYS.lists(), filters] as const,
};

export function usePasswordRequestsQuery(page: number, limit: number, status?: string) {
    return useQuery({
        queryKey: PASSWORD_REQUESTS_KEYS.list({ page, limit, status }),
        queryFn: () => authApi.getPasswordRequests(page, limit, status),
    });
}
