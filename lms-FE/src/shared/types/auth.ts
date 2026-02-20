export type UserRole = 'super_admin' | 'teacher' | 'student';

export interface DecodedJWT {
    sub: string;
    role: UserRole;
    name: string;
    exp: number;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}
