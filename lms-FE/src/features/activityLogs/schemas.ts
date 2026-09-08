import { z } from 'zod';

const userLogInfoSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
});

export const activityLogSchema = z.object({
    id: z.number(),
    user_id: z.number().nullable(),
    action: z.string(),
    entity_type: z.string().nullable(),
    entity_id: z.number().nullable(),
    details: z.string().nullable(),
    created_at: z.string(),
    user: userLogInfoSchema.nullable(),
});

export const paginatedActivityLogsSchema = z.object({
    items: z.array(activityLogSchema),
    total: z.number(),
    page: z.number(),
    size: z.number(),
    pages: z.number(),
});

export type ActivityLog = z.infer<typeof activityLogSchema>;
export type PaginatedActivityLogs = z.infer<typeof paginatedActivityLogsSchema>;
