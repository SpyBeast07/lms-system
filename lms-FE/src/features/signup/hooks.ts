import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signupApi } from './api';
import type { SignupFormData, SignupApprovalRequest } from './schemas';

const QUERY_KEY = 'signupRequests';

export const useSubmitSignupMutation = () => {
    return useMutation({
        mutationFn: (data: SignupFormData) => signupApi.submitRequest(data),
    });
};

export const useSignupRequestsQuery = (
    page = 1,
    size = 20,
    showAll = false
) => {
    return useQuery({
        queryKey: [QUERY_KEY, page, size, showAll],
        queryFn: () => signupApi.listRequests(page, size, showAll),
    });
};

export const useApproveSignupMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data?: SignupApprovalRequest }) =>
            signupApi.approveRequest(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useRejectSignupMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => signupApi.rejectRequest(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
