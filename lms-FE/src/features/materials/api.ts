import { api } from '../../shared/api/axios';
import type { MaterialNote, MaterialAssignment } from './schemas';

export const materialsApi = {
    // 1. Upload File (MinIO)
    uploadFile: async (file: File): Promise<{ file_url: string; size: number }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/v1/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data; // Expecting { file_url: ..., size: ... }
    },

    // 2. Create Note Record
    createNote: async (teacherId: string, data: Omit<MaterialNote, 'id' | 'teacher_id' | 'created_at'>): Promise<MaterialNote> => {
        const response = await api.post(`/materials/notes/${teacherId}`, data);
        return response.data;
    },

    // 3. Create Assignment Record
    createAssignment: async (teacherId: string, data: Omit<MaterialAssignment, 'id' | 'teacher_id' | 'created_at'>): Promise<MaterialAssignment> => {
        const response = await api.post(`/materials/assignments/${teacherId}`, data);
        return response.data;
    },

    // 3.5 Get Course Materials (used by both Teacher and Student dash)
    getCourseMaterials: async (courseId: string) => {
        const response = await api.get(`/materials/course/${courseId}`);
        return response.data;
    },

    // 4. Update Material (Generic)
    updateMaterial: async (id: string, data: any) => {
        const response = await api.put(`/materials/${id}`, data);
        return response.data;
    },

    // 5. Delete Material (Generic)
    deleteMaterial: async (id: string) => {
        const response = await api.delete(`/materials/${id}`);
        return response.data;
    }
};
