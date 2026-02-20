import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesService } from '../services';
import type { PresignedUrlRequest } from '../schemas';

const FILES_KEY = [{ entity: 'files' }] as const;

export const useFilesQuery = () => {
    return useQuery({
        queryKey: FILES_KEY,
        queryFn: filesService.listFiles,
    });
};

export const usePresignedUrlMutation = () => {
    return useMutation({
        mutationFn: (data: PresignedUrlRequest) => filesService.getPresignedUrl(data),
    });
};

export const useDeleteFileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (objectName: string) => filesService.deleteFile(objectName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FILES_KEY });
        }
    });
};
