import { useQuery } from '@tanstack/react-query';
import { coursesService } from '../../courses/services';
import { useAuthStore } from '../../../app/store/authStore';

const STUDENT_COURSES_KEY = [{ entity: 'student_courses' }] as const;

export const useStudentCourses = (page = 1, limit = 10) => {
    const { accessToken } = useAuthStore();

    return useQuery({
        queryKey: [...STUDENT_COURSES_KEY, { page, limit }],
        queryFn: () => coursesService.getCourses(page, limit),
        enabled: !!accessToken,
    });
};
