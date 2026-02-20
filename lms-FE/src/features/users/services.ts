import { usersApi } from './api';
import type { User, UserCreateData, UserUpdateData } from './schemas';
import type { PaginatedResponse } from '../../shared/types/pagination';

/**
 * Users Service Layer. 
 * Provides abstraction over the raw API layer. Add business logic here if needed.
 */
export const usersService = {
    getUsers: async (page = 1, limit = 10, deleted?: boolean): Promise<PaginatedResponse<User>> => {
        return await usersApi.getAll(page, limit, deleted);
    },

    getUserById: async (id: string): Promise<User> => {
        return await usersApi.getById(id);
    },

    createUser: async (payload: UserCreateData): Promise<User> => {
        return await usersApi.create(payload);
    },

    updateUser: async (id: string, payload: UserUpdateData): Promise<User> => {
        return await usersApi.update(id, payload);
    },

    deleteUser: async (id: string): Promise<void> => {
        await usersApi.delete(id);
    },

    restoreUser: async (id: string): Promise<void> => {
        await usersApi.restore(id);
    }
};
