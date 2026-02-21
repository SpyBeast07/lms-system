import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    requested_role: z.enum(['student', 'teacher'], {
        message: 'Please select a role',
    }),
});

export type SignupFormData = z.infer<typeof signupSchema>;

export interface SignupRequestRead {
    id: number;
    name: string;
    email: string;
    requested_role: string;
    approved_role: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    approved_at: string | null;
}

export interface PaginatedSignupRequests {
    items: SignupRequestRead[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface SignupApprovalRequest {
    approved_role?: 'student' | 'teacher' | null;
}
