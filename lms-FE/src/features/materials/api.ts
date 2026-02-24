import { api } from '../../shared/api/axios';

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
    createNote: async (teacherId: string, data: any): Promise<any> => {
        // Backend expects content_url, course_id as int
        const payload = {
            title: data.title,
            course_id: Number(data.course_id),
            content_url: data.file_url
        };
        const response = await api.post(`/materials/notes/${teacherId}`, payload);
        return response.data;
    },

    // 3. Create Assignment Record
    createAssignment: async (teacherId: string, data: any): Promise<any> => {
        // Backend schema requires assignment_type, and course_id as int
        const payload = {
            ...data,
            course_id: Number(data.course_id),
            assignment_type: 'long' // Default injection since UI lacks this field
        };
        const response = await api.post(`/materials/assignments/${teacherId}`, payload);
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
    },

    // 6. Restore Material
    restoreMaterial: async (id: string) => {
        const response = await api.post(`/materials/${id}/restore`);
        return response.data;
    },

    // 7. Get Teacher Specific Course Materials
    getTeacherCourseMaterials: async (teacherId: string, courseId: string) => {
        const response = await api.get(`/materials/teacher/${teacherId}/course/${courseId}`);
        return response.data;
    }
};
