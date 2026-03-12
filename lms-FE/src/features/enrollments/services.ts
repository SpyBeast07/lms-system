import { enrollmentsApi } from './api';
import type { AssignTeacherData, EnrollStudentData } from './schemas';

export const enrollmentsService = {
    assignTeacher: async (data: AssignTeacherData) => {
        try {
            return await enrollmentsApi.assignTeacher(data);
        } catch (error) {
            console.error('Failed to assign teacher:', error);
            throw error;
        }
    },
    enrollStudent: async (data: EnrollStudentData) => {
        try {
            return await enrollmentsApi.enrollStudent(data);
        } catch (error) {
            console.error('Failed to enroll student:', error);
            throw error;
        }
    },
    getTeacherAssignments: async () => {
        try {
            return await enrollmentsApi.getTeacherAssignments();
        } catch (error) {
            console.error('Failed to get teacher assignments:', error);
            throw error;
        }
    },
    getStudentEnrollments: async () => {
        try {
            return await enrollmentsApi.getStudentEnrollments();
        } catch (error) {
            console.error('Failed to get student enrollments:', error);
            throw error;
        }
    }
};
