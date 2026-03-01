import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentsService } from '../services';
import type { AssignTeacherData, EnrollStudentData } from '../schemas';

export const useAssignTeacherMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AssignTeacherData) => enrollmentsService.assignTeacher(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [{ entity: 'teacher_assignments' }] });
            queryClient.invalidateQueries({ queryKey: [{ entity: 'courses' }] }); // Just in case
        },
    });
};

export const useEnrollStudentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: EnrollStudentData) => enrollmentsService.enrollStudent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [{ entity: 'student_enrollments' }] });
            queryClient.invalidateQueries({ queryKey: [{ entity: 'courses' }] }); // Just in case
        },
    });
};

export const useTeacherAssignmentsQuery = () => {
    return useQuery({
        queryKey: [{ entity: 'teacher_assignments' }],
        queryFn: () => enrollmentsService.getTeacherAssignments(),
    });
};

export const useStudentEnrollmentsQuery = () => {
    return useQuery({
        queryKey: [{ entity: 'student_enrollments' }],
        queryFn: () => enrollmentsService.getStudentEnrollments(),
    });
};
