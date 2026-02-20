import { api } from '../../shared/api/axios';
import type { AssignTeacherData, EnrollStudentData } from './schemas';

export const enrollmentsApi = {
    assignTeacher: async (data: AssignTeacherData) => {
        const response = await api.post('/teacher-course/', data);
        return response.data;
    },
    enrollStudent: async (data: EnrollStudentData) => {
        // According to instructions: POST /student-course/
        const response = await api.post('/student-course/', data);
        return response.data;
    }
};
