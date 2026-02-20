import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { authService } from '../service';
import type { LoginFormData } from '../schemas';

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

