import { useMutation, useQuery } from '@tanstack/react-query';
import { enrollmentsService } from '../services';
import type { AssignTeacherData, EnrollStudentData } from '../schemas';

export const useAssignTeacherMutation = () => {
    return useMutation({
        mutationFn: (data: AssignTeacherData) => enrollmentsService.assignTeacher(data),
    });
};

export const useEnrollStudentMutation = () => {
    return useMutation({
        mutationFn: (data: EnrollStudentData) => enrollmentsService.enrollStudent(data),
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
