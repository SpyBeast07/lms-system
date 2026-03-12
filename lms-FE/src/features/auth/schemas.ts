import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export const changePasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address').optional(),
    current_password: z.string().min(6, 'Password must be at least 6 characters'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {

    message: "New passwords don't match",
    path: ["confirm_password"],
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export interface UserInfo {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface PasswordChangeRequestRead {
    id: number;
    user_id: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    resolved_at: string | null;
    user: UserInfo;
}

export interface PaginatedPasswordChangeRequests {
    items: PasswordChangeRequestRead[];
    total: number;
    page: number;
    size: number;
}
