import { api } from '../../shared/api/axios';
import type { PaginatedActivityLogs } from './schemas';

export interface ActivityLogsFilters {
    page?: number;
    size?: number;
    user_id?: number | null;
    action?: string;
}

export const activityLogsApi = {
    getLogs: async (filters: ActivityLogsFilters): Promise<PaginatedActivityLogs> => {
        const params: any = {
            page: filters.page || 1,
            size: filters.size || 20,
        };
        if (filters.user_id) params.user_id = filters.user_id;
        if (filters.action) params.action = filters.action;

        const response = await api.get('/activity-logs/', { params });
        return response.data;
    },

    getMyLogs: async (size = 10): Promise<PaginatedActivityLogs> => {
        const response = await api.get('/activity-logs/my', { params: { size } });
        return response.data;
    }
};
