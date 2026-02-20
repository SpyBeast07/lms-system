import { z } from 'zod';

export const healthResponseSchema = z.object({
    status: z.string(),
    database: z.string().optional(),
    minio: z.string().optional(),
    timestamp: z.string().optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
