import { api } from '../api/axios';

interface DashboardStats {
    courses: number;
    materials: number;
    assignments: number;
}

export const statsService = {
    getAdminStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/stats/admin');
        return response.data;
    },
    getTeacherStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/stats/teacher');
        return response.data;
    },
    getStudentStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/stats/student');
        return response.data;
    }
};
