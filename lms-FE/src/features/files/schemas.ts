import { z } from 'zod';

export const fileInfoSchema = z.object({
    object_name: z.string(),
    size: z.number(),
    last_modified: z.string(),
    content_type: z.string().optional(),
});

export type FileInfo = z.infer<typeof fileInfoSchema>;

export const presignedUrlRequestSchema = z.object({
    object_name: z.string(),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;

export const presignedUrlResponseSchema = z.object({
    url: z.string(),
});

export type PresignedUrlResponse = z.infer<typeof presignedUrlResponseSchema>;
