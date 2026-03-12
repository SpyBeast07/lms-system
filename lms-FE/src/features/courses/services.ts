import { coursesApi } from './api';
import type { Course, CourseCreateData, CourseUpdateData } from './schemas';
import type { PaginatedResponse } from '../../shared/types/pagination';

/**
 * Courses Service Layer.
 */
export const coursesService = {
    getCourses: async (page = 1, limit = 10, deleted?: boolean): Promise<PaginatedResponse<Course>> => {
        return await coursesApi.getAll(page, limit, deleted);
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
    },

    hardDeleteCourse: async (id: string): Promise<void> => {
        await coursesApi.hardDelete(id);
    }
};
