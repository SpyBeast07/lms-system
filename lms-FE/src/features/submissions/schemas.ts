import { z } from 'zod';

export const submissionSchema = z.object({
    id: z.number(),
    assignment_id: z.number(),
    student_id: z.number(),
    file_url: z.string().url(),
    comments: z.string().nullable().optional(),
    grade: z.number().nullable().optional(),
    feedback: z.string().nullable().optional(),
    submitted_at: z.string(),
    graded_at: z.string().nullable().optional(),
    student: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string()
    }).nullable().optional(),
});

export const submissionCreateSchema = z.object({
    assignment_id: z.number().min(1, 'Assignment is required'),
    file_url: z.string().url('A valid file URL is required'),
    comments: z.string().optional(),
});

export const submissionGradeSchema = z.object({
    grade: z.number().min(0, 'Grade cannot be negative'),
    feedback: z.string().optional(),
});

export type Submission = z.infer<typeof submissionSchema>;
export type SubmissionCreateData = z.infer<typeof submissionCreateSchema>;
export type SubmissionGradeData = z.infer<typeof submissionGradeSchema>;
