import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesService } from '../services';
import type { CourseCreateData, CourseUpdateData } from '../schemas';

const COURSES_KEY = ['courses'];

export const useCoursesQuery = () => {
    return useQuery({
        queryKey: COURSES_KEY,
        queryFn: coursesService.getCourses,
    });
};

export const useCreateCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CourseCreateData) => coursesService.createCourse(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};

export const useUpdateCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CourseUpdateData }) => coursesService.updateCourse(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};

export const useDeleteCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => coursesService.deleteCourse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};

export const useRestoreCourseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => coursesService.restoreCourse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURSES_KEY });
        }
    });
};
