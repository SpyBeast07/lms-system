import { api } from '../../shared/api/axios';
import type { FileInfo, PresignedUrlRequest, PresignedUrlResponse } from './schemas';
import type { PaginatedResponse } from '../../shared/types/pagination';

export const filesApi = {
    listFiles: async (page = 1, limit = 10): Promise<PaginatedResponse<FileInfo>> => {
        const response = await api.get('/api/v1/files/list', {
            params: { page, limit }
        });
        return response.data;
    },
    getFileInfo: async (objectName: string): Promise<FileInfo> => {
        const response = await api.get(`/api/v1/files/info/${objectName}`);
        return response.data;
    },
    getPresignedUrl: async (data: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
        const response = await api.post('/api/v1/files/presigned-url', data);
        return response.data;
    },
    deleteFile: async (objectName: string) => {
        const response = await api.delete(`/api/v1/files/${objectName}`);
        return response.data;
    }
};
