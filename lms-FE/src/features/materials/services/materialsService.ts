import { materialsApi } from '../api';
import type { AssignmentFormData } from '../schemas';

export const materialsService = {
    createAssignment: async (teacherId: string, data: AssignmentFormData) => {
        return await materialsApi.createAssignment(teacherId, data);
    },
    getCourseMaterials: async (courseId: string) => {
        return await materialsApi.getCourseMaterials(courseId);
    },
    updateMaterial: async (id: string, data: any) => {
        return await materialsApi.updateMaterial(id, data);
    },
    deleteMaterial: async (id: string) => {
        return await materialsApi.deleteMaterial(id);
    },
    restoreMaterial: async (id: string) => {
        return await materialsApi.restoreMaterial(id);
    },
    getTeacherCourseMaterials: async (teacher_id: string, course_id: string) => {
        return await materialsApi.getTeacherCourseMaterials(teacher_id, course_id);
    },
    getAssignmentDetails: async (assignment_id: string) => {
        return await materialsApi.getAssignmentDetails(assignment_id);
    }
};
