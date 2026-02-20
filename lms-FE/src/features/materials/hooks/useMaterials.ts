import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsService } from '../services/materialsService';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';
import type { MaterialAssignment } from '../schemas';

const MATERIALS_KEY = [{ entity: 'materials' }] as const;

export const useCourseMaterialsQuery = (courseId: string) => {
    return useQuery({
        queryKey: [...MATERIALS_KEY, courseId],
        queryFn: () => materialsService.getCourseMaterials(courseId),
        enabled: !!courseId,
    });
};

export const useCreateAssignmentMutation = () => {
    const queryClient = useQueryClient();
    const { accessToken } = useAuthStore();
    const tokenData = accessToken ? decodeToken(accessToken) : null;
    const teacherId = tokenData?.sub;

    return useMutation({
        mutationFn: async (data: Omit<MaterialAssignment, 'id' | 'teacher_id' | 'created_at'>) => {
            if (!teacherId) throw new Error('Not authenticated as teacher');
            return await materialsService.createAssignment(teacherId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
        }
    });
};


export const useDeleteMaterialMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return await materialsService.deleteMaterial(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
        }
    });
};
