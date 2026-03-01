import { z } from "zod";

export const PrincipalSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
});

export const SchoolSchema = z.object({
    id: z.number(),
    name: z.string(),
    subscription_start: z.string(),
    subscription_end: z.string(),
    max_teachers: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    principal: PrincipalSchema.optional(),
});

export const SchoolCreateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    subscription_start: z.string().nonempty("Subscription start date is required"),
    subscription_end: z.string().nonempty("Subscription end date is required"),
    max_teachers: z.number().min(1, "Must allow at least 1 teacher"),
});

export const SchoolUpdateSchema = z.object({
    name: z.string().optional(),
    subscription_end: z.string().optional(),
    max_teachers: z.number().optional(),
});

export const AssignPrincipalSchema = z.object({
    user_id: z.number().min(1, "Valid User ID is required to assign principal"),
});

export type School = z.infer<typeof SchoolSchema>;
export type SchoolCreatePayload = z.infer<typeof SchoolCreateSchema>;
export type SchoolUpdatePayload = z.infer<typeof SchoolUpdateSchema>;
export type AssignPrincipalPayload = z.infer<typeof AssignPrincipalSchema>;

export interface PaginatedSchools {
    items: School[];
    total: number;
    page: number;
    size: number;
    pages: number;
}
