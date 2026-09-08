import { useQuery } from '@tanstack/react-query';
import { healthService } from '../services';

const HEALTH_KEY = [{ entity: 'health' }] as const;

export const useHealthQuery = () => {
    return useQuery({
        queryKey: HEALTH_KEY,
        queryFn: healthService.getHealthStatus,
        refetchInterval: 30000, // Poll every 30 seconds
    });
};
