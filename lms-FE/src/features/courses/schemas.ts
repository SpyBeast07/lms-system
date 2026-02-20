import { z } from 'zod';

export const courseSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    instructor_id: z.string(),
    created_at: z.string().optional(),
    is_published: z.boolean().optional().default(false),
});

export const courseCreateSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    instructor_id: z.string().min(1, 'Instructor is required'),
});

export const courseUpdateSchema = courseCreateSchema.partial().extend({
    is_published: z.boolean().optional(),
});

export type Course = z.infer<typeof courseSchema>;
export type CourseCreateData = z.infer<typeof courseCreateSchema>;
export type CourseUpdateData = z.infer<typeof courseUpdateSchema>;
