import { z } from 'zod';

export const notificationSchema = z.object({
    id: z.number(),
    user_id: z.number(),
    type: z.string(),
    message: z.string(),
    is_read: z.boolean(),
    created_at: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;
