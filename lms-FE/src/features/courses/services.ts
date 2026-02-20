import { coursesApi } from './api';
import type { Course, CourseCreateData, CourseUpdateData } from './schemas';

/**
 * Courses Service Layer.
 */
export const coursesService = {
    getCourses: async (): Promise<Course[]> => {
        return await coursesApi.getAll();
    },

    getCourseById: async (id: string): Promise<Course> => {
        return await coursesApi.getById(id);
    },

    createCourse: async (payload: CourseCreateData): Promise<Course> => {
        return await coursesApi.create(payload);
    },

    updateCourse: async (id: string, payload: CourseUpdateData): Promise<Course> => {
        return await coursesApi.update(id, payload);
    },

    deleteCourse: async (id: string): Promise<void> => {
        await coursesApi.delete(id);
    },

    restoreCourse: async (id: string): Promise<void> => {
        await coursesApi.restore(id);
    }
};
