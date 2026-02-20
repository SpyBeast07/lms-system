import { z } from 'zod';

export const assignmentSubmissionSchema = z.object({
    assignment_id: z.string().min(1, 'Please select an assignment'),
    comments: z.string().optional(),
    // We will handle file payload separately in the component state, but let's map it here if needed
});

export type AssignmentSubmissionData = z.infer<typeof assignmentSubmissionSchema>;
