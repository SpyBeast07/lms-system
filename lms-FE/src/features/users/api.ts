import { api } from '../../shared/api/axios';
import type { User, UserCreateData, UserUpdateData } from './schemas';
import type { PaginatedResponse } from '../../shared/types/pagination';

export const usersApi = {
    getAll: async (page = 1, limit = 10, deleted?: boolean): Promise<PaginatedResponse<User>> => {
        const { data } = await api.get('/users/', {
            params: { page, limit, deleted }
        });
        return data;
    },

    getById: async (id: string): Promise<User> => {
        const { data } = await api.get(`/users/${id}/`);
        return data;
    },

    create: async (payload: UserCreateData): Promise<User> => {
        const { data } = await api.post('/users/', payload);
        return data;
    },

    update: async (id: string, payload: UserUpdateData): Promise<User> => {
        const { data } = await api.patch(`/users/${id}/`, payload);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}/`);
    },

    restore: async (id: string): Promise<void> => {
        await api.post(`/users/${id}/restore/`);
    },

    hardDelete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}/permanent/`);
    }
};
