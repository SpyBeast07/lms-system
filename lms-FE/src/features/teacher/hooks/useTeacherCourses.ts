import { useQuery } from '@tanstack/react-query';
import { coursesService } from '../../courses/services';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';

const TEACHER_COURSES_KEY = [{ entity: 'teacher_courses' }] as const;

export const useTeacherCourses = (page = 1, limit = 10) => {
    const { accessToken } = useAuthStore();
    const tokenData = accessToken ? decodeToken(accessToken) : null;
    const teacherId = tokenData?.sub;

    return useQuery({
        queryKey: [...TEACHER_COURSES_KEY, teacherId, { page, limit }],
        queryFn: () => coursesService.getCourses(page, limit),
        enabled: !!teacherId,
    });
};
