import { api } from '../../shared/api/axios';
import type { Submission, SubmissionCreateData, SubmissionGradeData, PaginatedSubmissions } from './schemas';

export const submissionsApi = {
    createSubmission: async (data: SubmissionCreateData): Promise<Submission> => {
        const response = await api.post('/submissions/', data);
        return response.data;
    },

    getStudentSubmissions: async (studentId: number): Promise<Submission[]> => {
        const response = await api.get(`/submissions/student/${studentId}`);
        return response.data.results;
    },

    getAssignmentSubmissions: async (assignmentId: number): Promise<Submission[]> => {
        const response = await api.get(`/submissions/assignment/${assignmentId}`);
        return response.data.results;
    },

    gradeSubmission: async (submissionId: number, data: SubmissionGradeData): Promise<Submission> => {
        const response = await api.patch(`/submissions/${submissionId}/grade`, data);
        return response.data;
    },

    getAttemptDetails: async (attemptId: number) => {
        const response = await api.get(`/assignments/attempts/${attemptId}`);
        return response.data;
    },
    
    getAssignmentAttempts: async (assignmentId: number) => {
        const response = await api.get(`/assignments/${assignmentId}/attempts`);
        return response.data;
    },

    getTeacherSubmissions: async (params: { course_id?: string, student_name?: string, limit?: number, offset?: number }): Promise<PaginatedSubmissions> => {
        const response = await api.get('/submissions/teacher', { params });
        return response.data;
    }
};
