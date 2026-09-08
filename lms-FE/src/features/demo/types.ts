import type { UserRole } from '../../shared/types/auth';

export type DemoRole = UserRole;

export interface DemoUserProfile {
    label: string;
    initials: string;
    description: string;
    name: string;
    email: string;
    schoolId: number | null;
    schoolName: string | null;
    landingPath: string;
}

export const DEMO_ROLES: Record<DemoRole, DemoUserProfile> = {
    super_admin: {
        label: 'Super Admin',
        initials: 'SA',
        description: 'Full platform control: schools, users, signup requests and system health.',
        name: 'Demo Super Admin',
        email: 'super.admin@demo.lms',
        schoolId: null,
        schoolName: null,
        landingPath: '/admin/dashboard',
    },
    principal: {
        label: 'Principal',
        initials: 'PR',
        description: 'School-level management of users, courses, enrollments and teacher review.',
        name: 'Demo Principal',
        email: 'principal@demo.lms',
        schoolId: 1,
        schoolName: 'Eurobliz International School',
        landingPath: '/principal/dashboard',
    },
    teacher: {
        label: 'Teacher',
        initials: 'TC',
        description: 'Create courses, upload materials, publish assignments and grade submissions.',
        name: 'Demo Teacher',
        email: 'teacher@demo.lms',
        schoolId: 1,
        schoolName: 'Eurobliz International School',
        landingPath: '/teacher/courses',
    },
    student: {
        label: 'Student',
        initials: 'ST',
        description: 'Access enrolled courses, learning materials, assignments and submission history.',
        name: 'Demo Student',
        email: 'student@demo.lms',
        schoolId: 1,
        schoolName: 'Eurobliz International School',
        landingPath: '/student/courses',
    },
};