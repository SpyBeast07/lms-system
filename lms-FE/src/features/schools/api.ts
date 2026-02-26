import { api as axiosInstance } from '../../shared/api/axios';
import type {
    School,
    SchoolCreatePayload,
    SchoolUpdatePayload,
    AssignPrincipalPayload,
} from "./schemas";
import type { PaginatedResponse } from '../../shared/types/pagination';

const BASE_URL = "/schools";

export const schoolsApi = {
    list: async (page = 1, size = 10): Promise<PaginatedResponse<School>> => {
        const { data } = await axiosInstance.get<PaginatedResponse<School>>(
            `${BASE_URL}/`,
            { params: { page, size } }
        );
        return data;
    },

    listPublic: async (): Promise<PaginatedResponse<School>> => {
        const { data } = await axiosInstance.get<PaginatedResponse<School>>(
            `${BASE_URL}/public`
        );
        return data;
    },

    get: async (id: number): Promise<School> => {
        const { data } = await axiosInstance.get<School>(`${BASE_URL}/${id}`);
        return data;
    },

    create: async (payload: SchoolCreatePayload): Promise<School> => {
        const { data } = await axiosInstance.post<School>(`${BASE_URL}/`, payload);
        return data;
    },

    update: async (id: number, payload: SchoolUpdatePayload): Promise<School> => {
        const { data } = await axiosInstance.patch<School>(
            `${BASE_URL}/${id}`,
            payload
        );
        return data;
    },

    assignPrincipal: async (
        schoolId: number,
        payload: AssignPrincipalPayload
    ): Promise<any> => {
        const { data } = await axiosInstance.post(
            `${BASE_URL}/${schoolId}/assign-principal`,
            payload
        );
        return data;
    },
};
