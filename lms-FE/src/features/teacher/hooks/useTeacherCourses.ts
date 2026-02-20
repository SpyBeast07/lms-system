import { useQuery } from '@tanstack/react-query';
import { coursesService } from '../../courses/services';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';

const TEACHER_COURSES_KEY = [{ entity: 'teacher_courses' }] as const;

export const useTeacherCourses = () => {
    const { accessToken } = useAuthStore();
    const tokenData = accessToken ? decodeToken(accessToken) : null;
    const teacherId = tokenData?.sub;

    return useQuery({
        queryKey: [...TEACHER_COURSES_KEY, teacherId],
        queryFn: async () => {
            // The backend /courses/ endpoint automatically filters by the current user's JWT role natively
            return await coursesService.getCourses();
        },
        enabled: !!teacherId,
    });
};
