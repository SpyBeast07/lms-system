import { materialsApi } from '../api';
import type { MaterialAssignment } from '../schemas';

export const materialsService = {
    createAssignment: async (teacherId: string, data: Omit<MaterialAssignment, 'id' | 'teacher_id' | 'created_at'>) => {
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
    }
};
