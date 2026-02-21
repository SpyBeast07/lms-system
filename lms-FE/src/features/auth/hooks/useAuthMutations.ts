import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { authService } from '../service';
import { authApi } from '../api';
import type { LoginFormData, ChangePasswordData } from '../schemas';


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
    return useMutation({
        mutationFn: (requestId: number) => authApi.approvePasswordRequest(requestId)
    });
};

export const useRejectPasswordRequestMutation = () => {
    return useMutation({
        mutationFn: (requestId: number) => authApi.rejectPasswordRequest(requestId)
    });
};

