import { useQuery } from '@tanstack/react-query';
import { activityLogsApi, type ActivityLogsFilters } from '../api';

export const useActivityLogsQuery = (filters: ActivityLogsFilters) => {
    return useQuery({
        queryKey: ['activityLogs', filters],
        queryFn: () => activityLogsApi.getLogs(filters),
        placeholderData: (previousData) => previousData, // keep previous data while fetching next page
    });
};
