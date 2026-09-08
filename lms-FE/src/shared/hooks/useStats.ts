import { useQuery } from '@tanstack/react-query';
import { statsService } from '../services/stats';

export const useAdminStatsQuery = () => {
    return useQuery({
        queryKey: ['stats', 'admin'],
        queryFn: statsService.getAdminStats,
    });
};

export const useTeacherStatsQuery = () => {
    return useQuery({
        queryKey: ['stats', 'teacher'],
        queryFn: statsService.getTeacherStats,
    });
};

export const useStudentStatsQuery = () => {
    return useQuery({
        queryKey: ['stats', 'student'],
        queryFn: statsService.getStudentStats,
    });
};
