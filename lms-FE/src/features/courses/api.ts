import { api } from '../../shared/api/axios';
import type { Course, CourseCreateData, CourseUpdateData } from './schemas';

export const coursesApi = {
    getAll: async (): Promise<Course[]> => {
        const { data } = await api.get('/courses');
        return data;
    },

    getById: async (id: string): Promise<Course> => {
        const { data } = await api.get(`/courses/${id}`);
        return data;
    },

    create: async (payload: CourseCreateData): Promise<Course> => {
        const { data } = await api.post('/courses', payload);
        return data;
    },

    update: async (id: string, payload: CourseUpdateData): Promise<Course> => {
        const { data } = await api.patch(`/courses/${id}`, payload);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/courses/${id}`);
    }
};
