import { healthApi } from './api';

export const healthService = {
    getHealthStatus: async () => {
        try {
            return await healthApi.getHealthStatus();
        } catch (error) {
            console.error('Failed to get health status:', error);
            throw error;
        }
    }
};
