import { useMutation } from '@tanstack/react-query';
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
