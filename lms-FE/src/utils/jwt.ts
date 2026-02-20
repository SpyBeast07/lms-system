import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
    sub: string;
    role: 'super_admin' | 'teacher' | 'student';
    name: string;
    exp: number;
    exp_date?: Date;
}

/**
 * Decodes a JWT token and returns the payload.
 * Also calculates an actual Date object for expiration if needed.
 */
export const decodeToken = (token: string): DecodedToken | null => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        return {
            ...decoded,
            exp_date: new Date(decoded.exp * 1000)
        };
    } catch (error) {
        console.error('Invalid token format', error);
        return null;
    }
};
