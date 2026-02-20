import { z } from 'zod';

export const materialNoteSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, 'Title is required'),
    course_id: z.string().min(1, 'Course is required'),
    file_url: z.string().url('A valid file URL is required'),
    teacher_id: z.string(),
    created_at: z.string().optional()
});

export const materialAssignmentSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, 'Title is required'),
    course_id: z.string().min(1, 'Course is required'),
    teacher_id: z.string(),
    total_marks: z.number().min(1, 'Total marks must be greater than 0'),
    due_date: z.string().min(1, 'Due date is required'),
    max_attempts: z.number().min(1, 'Requires at least 1 attempt').default(1),
    created_at: z.string().optional()
});

export const materialUploadFormSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    course_id: z.string().min(1, 'Course is required'),
});

export const assignmentFormSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    course_id: z.string().min(1, 'Course is required'),
    total_marks: z.number().min(1),
    due_date: z.string(),
    max_attempts: z.number().min(1)
});

export type MaterialNote = z.infer<typeof materialNoteSchema>;
export type MaterialAssignment = z.infer<typeof materialAssignmentSchema>;
export type MaterialUploadFormData = z.infer<typeof materialUploadFormSchema>;
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
