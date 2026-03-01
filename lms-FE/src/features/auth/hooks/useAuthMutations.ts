import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { authService } from '../service';
import { authApi } from '../api';
import type { LoginFormData, ChangePasswordData } from '../schemas';
import { useAuthStore } from '../../../app/store/authStore';


export const useLoginMutation = () => {
    const router = useRouter();

    return useMutation({
        mutationFn: (data: LoginFormData) => authService.loginService(data),
        onSuccess: () => {
            // Direct user to dashboard immediately upon successful login
            router.navigate({ to: '/' });
        },
    });
};

export const useRequestPasswordChangeMutation = () => {
    return useMutation({
        mutationFn: (data: ChangePasswordData & { isPublic?: boolean }) => authApi.requestPasswordChange({
            email: data.email,
            current_password: data.current_password,
            new_password: data.new_password,
            isPublic: data.isPublic
        })
    });
};


export const useApprovePasswordRequestMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId: number) => authApi.approvePasswordRequest(requestId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['passwordRequests'] })
    });
};

export const useRejectPasswordRequestMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId: number) => authApi.rejectPasswordRequest(requestId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['passwordRequests'] })
    });
};

export const useSwitchRoleMutation = () => {
    const router = useRouter();
    const { setTokens } = useAuthStore();

    return useMutation({
        mutationFn: (targetRole: string) => authApi.switchRole(targetRole),
        onSuccess: (tokens, targetRole) => {
            // Update auth store with new tokens representing the new role
            setTokens(tokens.access_token, tokens.refresh_token);

            // Redirect to appropriate dashboard
            if (targetRole === 'teacher') {
                router.navigate({ to: '/teacher' });
            } else if (targetRole === 'student') {
                router.navigate({ to: '/student' });
            } else if (targetRole === 'principal') {
                router.navigate({ to: '/principal' });
            }
        },
    });
};

