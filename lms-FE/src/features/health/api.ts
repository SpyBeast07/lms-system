import { api } from '../../shared/api/axios';
import type { HealthResponse } from './schemas';

export const healthApi = {
    getHealthStatus: async (): Promise<HealthResponse> => {
        // As per instructions: GET /health
        const response = await api.get('/health');
        return response.data;
    }
};
