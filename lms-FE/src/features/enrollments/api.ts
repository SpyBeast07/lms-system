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
    },
    getTeacherAssignments: async () => {
        const response = await api.get('/teacher-course/');
        return response.data;
    },
    getStudentEnrollments: async () => {
        const response = await api.get('/student-course/');
        return response.data;
    }
};
