import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolsApi } from "./api";
import {
    type SchoolCreatePayload,
    type SchoolUpdatePayload,
    type AssignPrincipalPayload,
} from "./schemas";

export const useSchools = (page = 1, size = 10) => {
    return useQuery({
        queryKey: ["schools", page, size],
        queryFn: () => schoolsApi.list(page, size),
    });
};

export const usePublicSchools = () => {
    return useQuery({
        queryKey: ["schools", "public"],
        queryFn: () => schoolsApi.listPublic(),
    });
};

export const useSchool = (id: number) => {
    return useQuery({
        queryKey: ["schools", id],
        queryFn: () => schoolsApi.get(id),
        enabled: !!id,
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

export const useUpdateSchool = (id: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: SchoolUpdatePayload) =>
            schoolsApi.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schools"] });
            queryClient.invalidateQueries({ queryKey: ["schools", id] });
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
