import { z } from 'zod';

export const assignmentSubmissionSchema = z.object({
    assignment_id: z.string().min(1, 'Please select an assignment'),
    comments: z.string().optional(),
    answers: z.array(z.object({
        question_id: z.number(),
        selected_option_ids: z.array(z.number()).optional(),
        answer_text: z.string().optional(),
    })).optional()
});

export type AssignmentSubmissionData = z.infer<typeof assignmentSubmissionSchema>;
