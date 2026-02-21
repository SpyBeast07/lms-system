import { api } from '../../shared/api/axios';
import type {
    SignupFormData,
    SignupRequestRead,
    PaginatedSignupRequests,
    SignupApprovalRequest,
} from './schemas';

export const signupApi = {
    /** Public — submit a new signup request */
    submitRequest: async (data: SignupFormData): Promise<SignupRequestRead> => {
        const response = await api.post<SignupRequestRead>('/signup', data);
        return response.data;
    },

    /** Admin — list pending (or all) requests */
    listRequests: async (
        page = 1,
        size = 20,
        showAll = false
    ): Promise<PaginatedSignupRequests> => {
        const response = await api.get<PaginatedSignupRequests>('/signup-requests', {
            params: { page, size, show_all: showAll },
        });
        return response.data;
    },

    /** Admin — approve a request, optionally override the role */
    approveRequest: async (
        id: number,
        data: SignupApprovalRequest = {}
    ): Promise<SignupRequestRead> => {
        const response = await api.patch<SignupRequestRead>(
            `/signup-requests/${id}/approve`,
            data
        );
        return response.data;
    },

    /** Admin — reject a request */
    rejectRequest: async (id: number): Promise<SignupRequestRead> => {
        const response = await api.patch<SignupRequestRead>(
            `/signup-requests/${id}/reject`
        );
        return response.data;
    },
};
