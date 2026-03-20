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
    total_marks: z.number().min(0),
    due_date: z.coerce.date(),
    max_attempts: z.number().min(1),
    assignment_type: z.enum(['FILE_UPLOAD', 'MCQ', 'TEXT']),
    description: z.string().optional(),
    reference_materials: z.array(z.object({
        type: z.enum(['file', 'link']),
        name: z.string().min(1, 'Name is required'),
        url: z.string(),
        file: z.any().optional()
    })).default([]),
    questions: z.array(z.object({
        question_text: z.string().min(1, 'Question text is required'),
        question_type: z.enum(['MCQ', 'TEXT']),
        marks: z.number().min(0),
        order_index: z.number().int(),
        options: z.array(z.object({
            option_text: z.string().min(1, 'Option text is required'),
            is_correct: z.boolean()
        })).optional()
    })).optional()
}).superRefine((data, ctx) => {
    if (data.assignment_type === 'MCQ' || data.assignment_type === 'TEXT') {
        if (!data.questions || data.questions.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Please add at least one question',
                path: ['questions']
            });
        }
    }

    if (data.questions) {
        data.questions.forEach((q, idx) => {
            if (q.question_type === 'MCQ') {
                if (!q.options || q.options.length === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'MCQ must have at least one option',
                        path: ['questions', idx, 'options']
                    });
                } else if (!q.options.some(opt => opt.is_correct)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'At least one option must be marked correct',
                        path: ['questions', idx, 'options']
                    });
                }
            }
        });
    }
});

export type MaterialNote = z.infer<typeof materialNoteSchema>;
export type MaterialAssignment = z.infer<typeof materialAssignmentSchema>;
export type MaterialUploadFormData = z.infer<typeof materialUploadFormSchema>;
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
