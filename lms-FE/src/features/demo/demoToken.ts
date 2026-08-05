import type { AuthTokens } from '../../shared/types/auth';
import { DEMO_ROLES, type DemoRole } from './types';

const toBase64Url = (value: unknown): string =>
    btoa(JSON.stringify(value))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

// Numeric `sub` values keep parse-based helpers (e.g. studentId parsing) working.
const DEMO_SUB: Record<DemoRole, string> = {
    super_admin: '1000',
    principal: '1001',
    teacher: '1002',
    student: '1003',
};

export const createDemoAccessToken = (role: DemoRole): string => {
    const profile = DEMO_ROLES[role];
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: DEMO_SUB[role],
        role,
        base_role: role,
        name: profile.name,
        email: profile.email,
        school_id: profile.schoolId,
        school_name: profile.schoolName,
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        iat: now,
        exp: now + 30 * 24 * 60 * 60,
    };
    return `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url(payload)}.demo`;
};

export const createDemoTokens = (role: DemoRole): AuthTokens => ({
    access_token: createDemoAccessToken(role),
    refresh_token: `demo-refresh-${role}-${Date.now()}`,
    token_type: 'bearer',
});

export const DEMO_SUB_IDS = DEMO_SUB;