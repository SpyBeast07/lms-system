import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services';
import type { UserCreateData } from '../schemas';

const USERS_KEY = [{ entity: 'users' }] as const;

export const useUsersQuery = () => {
    return useQuery({
        queryKey: USERS_KEY,
        queryFn: usersService.getUsers,
    });
};

export const useCreateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UserCreateData) => usersService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY });
        }
    });
};

export const useDeleteUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY });
        }
    });
};

export const useRestoreUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersService.restoreUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY });
        }
    });
};
