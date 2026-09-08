import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadMaterialService } from '../services/uploadMaterialService';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';

export const useUploadNotes = () => {
    const queryClient = useQueryClient();
    const { accessToken } = useAuthStore();
    const tokenData = accessToken ? decodeToken(accessToken) : null;
    const teacherId = tokenData?.sub;

    return useMutation({
        mutationFn: async (data: { file: File, title: string, course_id: string }) => {
            if (!teacherId) throw new Error('Not authenticated as teacher');
            return await uploadMaterialService.uploadNoteWithFile(
                teacherId,
                data.file,
                { title: data.title, course_id: data.course_id }
            );
        },
        onSuccess: () => {
            // Invalidate queries that fetch materials to refetch the new note
            queryClient.invalidateQueries({ queryKey: [{ entity: 'materials' }] });
        }
    });
};
