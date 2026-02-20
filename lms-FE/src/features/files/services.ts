import { filesApi } from './api';
import type { PresignedUrlRequest } from './schemas';

export const filesService = {
    listFiles: async () => {
        try {
            return await filesApi.listFiles();
        } catch (error) {
            console.error('Failed to list files:', error);
            throw error;
        }
    },
    getFileInfo: async (objectName: string) => {
        try {
            return await filesApi.getFileInfo(objectName);
        } catch (error) {
            console.error('Failed to get file info:', error);
            throw error;
        }
    },
    getPresignedUrl: async (data: PresignedUrlRequest) => {
        try {
            return await filesApi.getPresignedUrl(data);
        } catch (error) {
            console.error('Failed to get presigned URL:', error);
            throw error;
        }
    },
    deleteFile: async (objectName: string) => {
        try {
            return await filesApi.deleteFile(objectName);
        } catch (error) {
            console.error('Failed to delete file:', error);
            throw error;
        }
    }
};
