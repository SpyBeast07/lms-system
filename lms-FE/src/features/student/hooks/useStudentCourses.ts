import { useQuery } from '@tanstack/react-query';
import { coursesService } from '../../courses/services';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';

const STUDENT_COURSES_KEY = [{ entity: 'student_courses' }] as const;

export const useStudentCourses = () => {
    const { accessToken } = useAuthStore();
    const tokenData = accessToken ? decodeToken(accessToken) : null;
    const studentId = tokenData?.sub;

    return useQuery({
        queryKey: [...STUDENT_COURSES_KEY, studentId],
        queryFn: async () => {
            const allCourses = await coursesService.getCourses();
            if (!studentId) return [];

            // Note: Assuming backend returns an enrollments or students array to filter by
            // In a fully normalized backend, an explicit `/users/{id}/courses` endpoint would be ideal.
            return allCourses.filter((course: any) => {
                // Mock filter: if backend only returns all courses without enrollment arrays,
                // we safely fallback. Ideally course mapping has student associations mapped.
                if (course.students && Array.isArray(course.students)) {
                    return course.students.includes(studentId) || course.students.some((s: any) => s.id === studentId);
                }
                // Fallback: If no relation data is returned, we can't accurately filter client-side flawlessly.
                return true;
            });
        },
        enabled: !!studentId,
    });
};
