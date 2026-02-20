import { api } from '../../shared/api/axios';
import type { FileInfo, PresignedUrlRequest, PresignedUrlResponse } from './schemas';

export const filesApi = {
    listFiles: async (): Promise<FileInfo[]> => {
        const response = await api.get('/api/v1/files/list');
        return response.data.files || [];
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
