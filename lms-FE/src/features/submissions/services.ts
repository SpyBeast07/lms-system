import { submissionsApi } from './api';
import type { SubmissionCreateData, SubmissionGradeData } from './schemas';

export const submissionsService = {
    createSubmission: (data: SubmissionCreateData) => submissionsApi.createSubmission(data),
    getStudentSubmissions: (studentId: number) => submissionsApi.getStudentSubmissions(studentId),
    getAssignmentSubmissions: (assignmentId: number) => submissionsApi.getAssignmentSubmissions(assignmentId),
    gradeSubmission: (submissionId: number, data: SubmissionGradeData) => submissionsApi.gradeSubmission(submissionId, data),
};
