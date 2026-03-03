import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolsApi } from "./api";
import {
    type SchoolCreatePayload,
    type AssignPrincipalPayload,
} from "./schemas";

export const useSchools = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ["schools", page, limit],
        queryFn: () => schoolsApi.list(page, limit),
    });
};

export const usePublicSchools = () => {
    return useQuery({
        queryKey: ["schools", "public"],
        queryFn: () => schoolsApi.listPublic(),
    });
};

export const useCreateSchool = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: SchoolCreatePayload) => schoolsApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schools"] });
        },
    });
};

export const useAssignPrincipal = (schoolId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: AssignPrincipalPayload) =>
            schoolsApi.assignPrincipal(schoolId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schools"] });
            // Might want to invalidate users as well, since this changes a user role
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};
