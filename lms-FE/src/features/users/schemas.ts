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
    school_id: z.number().int().positive().optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'principal' && (!data.school_id || isNaN(data.school_id))) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please select a school for the principal',
            path: ['school_id'],
        });
    }
});

export const userUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(['super_admin', 'principal', 'teacher', 'student'] as const).optional(),
    is_active: z.boolean().optional(),
});

export type User = z.infer<typeof userSchema>;
export type UserCreateData = z.infer<typeof userCreateSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
