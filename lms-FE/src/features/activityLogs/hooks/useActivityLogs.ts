import { useQuery } from '@tanstack/react-query';
import { activityLogsApi, type ActivityLogsFilters } from '../api';

export const useActivityLogsQuery = (filters: ActivityLogsFilters) => {
    return useQuery({
        queryKey: ['activityLogs', filters],
        queryFn: () => activityLogsApi.getLogs(filters),
        placeholderData: (previousData) => previousData,
    });
};

export const useMyActivityLogsQuery = (size = 8) => {
    return useQuery({
        queryKey: ['myActivityLogs', size],
        queryFn: () => activityLogsApi.getMyLogs(size),
        staleTime: 30_000,
    });
};
