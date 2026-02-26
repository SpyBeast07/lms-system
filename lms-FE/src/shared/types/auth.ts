export type UserRole = 'super_admin' | 'principal' | 'teacher' | 'student';

export interface DecodedJWT {
    sub: string;
    role: UserRole;
    name: string;
    school_id: number | null;
    school_name?: string | null;
    subscription_end?: string | null;
    exp: number;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}
