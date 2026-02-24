import { z } from 'zod';

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['super_admin', 'principal', 'teacher', 'student'] as const),
    created_at: z.string().optional(),
    is_active: z.boolean().optional().default(true),
    is_deleted: z.boolean().optional().default(false),
});

export const userCreateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['super_admin', 'principal', 'teacher', 'student'] as const, {
        message: 'Please select a valid role',
    }),
});

export const userUpdateSchema = userCreateSchema.partial().extend({
    is_active: z.boolean().optional(),
});

export type User = z.infer<typeof userSchema>;
export type UserCreateData = z.infer<typeof userCreateSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
