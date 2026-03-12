import { z } from 'zod';

export interface Submission {
    id: number;
    assignment_id: number;
    student_id: number;
    submission_type: string;
    title?: string;
    submitted_at: string;
    graded_at?: string | null;
    status: string;
    comments?: string | null;

    // File upload fields
    file_url?: string;
    grade?: number | null;
    feedback?: string | null;

    // Assessment fields
    total_score?: number | null;
    total_marks?: number | null;
    attempt_number?: number | null;
    teacher_feedback?: string | null;

    student?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

export const submissionCreateSchema = z.object({
    assignment_id: z.number().min(1, 'Assignment is required'),
    file_url: z.string().url('A valid file URL is required'),
    object_name: z.string().optional(),
    comments: z.string().optional(),
});

export const submissionGradeSchema = z.object({
    submission_type: z.string().optional(),
    grade: z.number().min(0, 'Grade cannot be negative'),
    feedback: z.string().optional().nullable(),
});

export type SubmissionCreateData = z.infer<typeof submissionCreateSchema>;
export type SubmissionGradeData = z.infer<typeof submissionGradeSchema>;

export interface AttemptAnswer {
    question_id: number;
    answer_text?: string;
    selected_option_id?: number;
    marks_obtained?: number;
    question?: {
        id: number;
        question_text: string;
        question_type: string;
        options?: {
            id: number;
            option_text: string;
            is_correct: boolean;
        }[];
    };
}

export interface StudentAttemptDetails {
    id: number;
    student_id: number;
    assignment_id: number;
    attempt_number: number;
    submitted_at: string;
    total_score: number;
    total_marks?: number;
    status: string;
    answers: AttemptAnswer[];
}

export interface PaginatedSubmissions {
    total_count: number;
    results: Submission[];
}
