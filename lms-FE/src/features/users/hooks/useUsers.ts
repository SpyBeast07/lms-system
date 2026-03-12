import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services';
import type { UserCreateData } from '../schemas';

const USERS_KEY = [{ entity: 'users' }] as const;

export const useUsersQuery = (page = 1, limit = 10, deleted?: boolean) => {
    return useQuery({
        queryKey: [...USERS_KEY, { page, limit, deleted }],
        queryFn: () => usersService.getUsers(page, limit, deleted),
    });
};

export const useCreateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UserCreateData) => usersService.createUser(data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY });
        }
    });
};

export const useDeleteUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersService.deleteUser(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY });
        }
    });
};

export const useRestoreUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersService.restoreUser(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY });
        }
    });
};

export const useHardDeleteUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersService.hardDeleteUser(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY });
        }
    });
};
