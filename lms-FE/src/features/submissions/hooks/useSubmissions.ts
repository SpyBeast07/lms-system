import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionsService } from '../services';
import type { SubmissionCreateData, SubmissionGradeData } from '../schemas';

const SUBMISSIONS_KEY = ['submissions'];

// Fetch submissions for a specific student
export const useStudentSubmissionsQuery = (studentId: number | undefined) => {
    return useQuery({
        queryKey: [...SUBMISSIONS_KEY, 'student', studentId],
        queryFn: () => submissionsService.getStudentSubmissions(studentId!),
        enabled: !!studentId,
    });
};

// Fetch all submissions for an assignment (Teacher view)
export const useAssignmentSubmissionsQuery = (assignmentId: number | undefined) => {
    return useQuery({
        queryKey: [...SUBMISSIONS_KEY, 'assignment', assignmentId],
        queryFn: () => submissionsService.getAssignmentSubmissions(assignmentId!),
        enabled: !!assignmentId,
    });
};

// Student submits an assignment
export const useCreateSubmissionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SubmissionCreateData) => submissionsService.createSubmission(data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEY });
        },
    });
};

// Teacher grades a submission
export const useGradeSubmissionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ submissionId, data }: { submissionId: number; data: SubmissionGradeData }) =>
            submissionsService.gradeSubmission(submissionId, data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEY });
        },
    });
};
