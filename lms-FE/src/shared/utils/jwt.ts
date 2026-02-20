import { jwtDecode } from 'jwt-decode';
import type { DecodedJWT } from '../types/auth';

/**
 * Safely decodes a JWT token and returns the payload.
 * Returns null if the token is invalid or structurally compromised.
 */
export const decodeToken = (token: string | null): DecodedJWT | null => {
    if (!token) return null;
    try {
        const decoded = jwtDecode<DecodedJWT>(token);

        // Basic temporal validity check depending on your application needs
        // Note: The backend 401 response is the supreme source of truth for expiration
        if (decoded.exp && (decoded.exp * 1000) < Date.now()) {
            return null;
        }

        return decoded;
    } catch (e) {
        console.error("Failed to decode standard JWT token format.");
        return null;
    }
};
