import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesService } from '../services';
import type { CourseCreateData } from '../schemas';

const COURSES_KEY = [{ entity: 'courses' }] as const;

export const useCoursesQuery = (page = 1, limit = 10, deleted?: boolean) => {
    return useQuery({
        queryKey: [...COURSES_KEY, { page, limit, deleted }],
        queryFn: () => coursesService.getCourses(page, limit, deleted),
    });
};

export const useCourseQuery = (id: string) => {
    return useQuery({
        queryKey: [...COURSES_KEY, id],
        queryFn: () => coursesService.getCourseById(id),
        enabled: !!id,
    });
};

export const useCreateCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CourseCreateData) => coursesService.createCourse(data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};

export const useDeleteCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => coursesService.deleteCourse(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};

export const useRestoreCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => coursesService.restoreCourse(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};

export const useHardDeleteCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => coursesService.hardDeleteCourse(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};
