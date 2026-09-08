import { useDemoStore } from './store';
import { createDemoAccessToken } from './demoToken';
import { DEMO_ROLES, type DemoRole } from './types';

const demoTokenResponse = (demoRole: DemoRole) => ({
    access_token: createDemoAccessToken(demoRole),
    refresh_token: `demo-refresh-${demoRole}-${Date.now()}`,
    token_type: 'bearer',
});

const daysFromNow = (days: number, hour = 10): string => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
};

const daysAgo = (days: number, hour = 9): string => {
    const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
};

interface DemoCourse {
    id: string;
    name: string;
    description: string;
    instructor_id: string;
    created_at: string;
    is_published: boolean;
    is_deleted: boolean;
}

const DEMO_COURSES: DemoCourse[] = [
    {
        id: '1',
        name: 'Introduction to Computer Science',
        description: 'Foundations of programming, data structures, and algorithmic thinking.',
        instructor_id: '1002',
        created_at: daysAgo(120),
        is_published: true,
        is_deleted: false,
    },
    {
        id: '2',
        name: 'Mathematics for Engineers',
        description: 'Linear algebra, calculus, and differential equations with engineering applications.',
        instructor_id: '1002',
        created_at: daysAgo(110),
        is_published: true,
        is_deleted: false,
    },
    {
        id: '3',
        name: 'Physics Lab Fundamentals',
        description: 'Hands-on laboratory experiments covering mechanics, optics, and electromagnetism.',
        instructor_id: '1004',
        created_at: daysAgo(95),
        is_published: true,
        is_deleted: false,
    },
    {
        id: '4',
        name: 'Database Systems',
        description: 'Relational modeling, SQL, indexing, and transaction management.',
        instructor_id: '1005',
        created_at: daysAgo(60),
        is_published: true,
        is_deleted: false,
    },
    {
        id: '5',
        name: 'English Literature & Composition',
        description: 'Critical reading, essay writing, and literary analysis.',
        instructor_id: '1006',
        created_at: daysAgo(40),
        is_published: false,
        is_deleted: false,
    },
    {
        id: '6',
        name: 'Mathematics Remedial',
        description: 'Archived bridge course for foundational math skills.',
        instructor_id: '1002',
        created_at: daysAgo(200),
        is_published: false,
        is_deleted: true,
    },
];

interface DemoUser {
    id: string;
    name: string;
    email: string;
    role: DemoRole;
    created_at: string;
    is_active: boolean;
    is_deleted: boolean;
}

const DEMO_USERS: DemoUser[] = [
    { id: '1000', name: 'Demo Super Admin', email: 'super.admin@demo.lms', role: 'super_admin', created_at: daysAgo(300), is_active: true, is_deleted: false },
    { id: '1001', name: 'Demo Principal', email: 'principal@demo.lms', role: 'principal', created_at: daysAgo(280), is_active: true, is_deleted: false },
    { id: '1002', name: 'Demo Teacher', email: 'teacher@demo.lms', role: 'teacher', created_at: daysAgo(250), is_active: true, is_deleted: false },
    { id: '1003', name: 'Demo Student', email: 'student@demo.lms', role: 'student', created_at: daysAgo(200), is_active: true, is_deleted: false },
    { id: '1004', name: 'Sarah Teacher', email: 'sarah.teacher@demo.lms', role: 'teacher', created_at: daysAgo(220), is_active: true, is_deleted: false },
    { id: '1005', name: 'Mark Teacher', email: 'mark.teacher@demo.lms', role: 'teacher', created_at: daysAgo(210), is_active: true, is_deleted: false },
    { id: '1006', name: 'Lena Teacher', email: 'lena.teacher@demo.lms', role: 'teacher', created_at: daysAgo(190), is_active: true, is_deleted: false },
    { id: '1007', name: 'Emma Student', email: 'emma.student@demo.lms', role: 'student', created_at: daysAgo(180), is_active: true, is_deleted: false },
    { id: '1008', name: 'Noah Student', email: 'noah.student@demo.lms', role: 'student', created_at: daysAgo(170), is_active: true, is_deleted: false },
    { id: '1009', name: 'Ava Student', email: 'ava.student@demo.lms', role: 'student', created_at: daysAgo(160), is_active: true, is_deleted: false },
    { id: '1010', name: 'Oliver Turner', email: 'oliver.turner@demo.lms', role: 'teacher', created_at: daysAgo(100), is_active: false, is_deleted: true },
];

const currentRole = (): DemoRole => useDemoStore.getState().demoRole || 'super_admin';

const coursesForRole = (role: DemoRole): DemoCourse[] => {
    if (role === 'teacher') return DEMO_COURSES.filter((c) => !c.is_deleted && (c.id === '1' || c.id === '2'));
    if (role === 'student') return DEMO_COURSES.filter((c) => !c.is_deleted && (c.id === '1' || c.id === '2' || c.id === '3'));
    return DEMO_COURSES.filter((c) => !c.is_deleted);
};

interface DemoMaterial {
    id: string;
    type: 'notes' | 'assignment';
    title: string;
    course_id: string;
    teacher_id: string;
    created_at: string;
    file_url?: string;
    assignment_type?: 'FILE_UPLOAD' | 'MCQ' | 'TEXT';
    total_marks?: number;
    due_date?: string;
    max_attempts?: number;
    attempts_made?: number;
    submission_status?: 'submitted' | 'pending';
    description?: string;
    is_deleted?: boolean;
}

const materialsForCourse = (courseId: string): DemoMaterial[] => {
    const notes: DemoMaterial[] = [
        {
            id: `n${courseId}1`,
            type: 'notes',
            title: `Week 1 Lecture Notes — Course ${courseId}`,
            course_id: courseId,
            teacher_id: '1002',
            created_at: daysAgo(14),
            file_url: `https://demo.lms/files/course-${courseId}/notes-week1.pdf`,
        },
        {
            id: `n${courseId}2`,
            type: 'notes',
            title: `Week 2 Supplementary Reading — Course ${courseId}`,
            course_id: courseId,
            teacher_id: '1002',
            created_at: daysAgo(7),
            file_url: `https://demo.lms/files/course-${courseId}/reading-week2.pdf`,
        },
    ];

    const assignments: DemoMaterial[] = [
        {
            id: `a${courseId}1`,
            type: 'assignment',
            title: `Problem Set 1 — Course ${courseId}`,
            course_id: courseId,
            teacher_id: '1002',
            created_at: daysAgo(10),
            assignment_type: 'MCQ',
            total_marks: 50,
            due_date: daysFromNow(10),
            max_attempts: 3,
            attempts_made: 1,
            submission_status: 'submitted',
            description: 'Complete the multiple choice quiz covering weeks 1-2 content.',
        },
        {
            id: `a${courseId}2`,
            type: 'assignment',
            title: `Lab Report — Course ${courseId}`,
            course_id: courseId,
            teacher_id: '1002',
            created_at: daysAgo(4),
            assignment_type: 'FILE_UPLOAD',
            total_marks: 100,
            due_date: daysFromNow(5),
            max_attempts: 1,
            attempts_made: 0,
            submission_status: 'pending',
            description: 'Upload your formatted lab report as a PDF.',
        },
    ];

    return [...notes, ...assignments];
};

const paginate = <T>(items: T[], page: number, limit: number) => {
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total: items.length, page, limit };
};

const logsForRole = (role: DemoRole, page: number, size: number) => {
    const baseLogs = [
        {
            id: 1,
            user_id: 1002,
            action: 'course_created',
            entity_type: 'course',
            entity_id: 1,
            details: 'Created course "Introduction to Computer Science"',
            created_at: daysAgo(2),
            user: { id: 1002, name: 'Demo Teacher', email: 'teacher@demo.lms', role: 'teacher' },
        },
        {
            id: 2,
            user_id: 1003,
            action: 'submission_created',
            entity_type: 'submission',
            entity_id: 51,
            details: 'Submitted assignment "Problem Set 1"',
            created_at: daysAgo(1),
            user: { id: 1003, name: 'Demo Student', email: 'student@demo.lms', role: 'student' },
        },
        {
            id: 3,
            user_id: 1002,
            action: 'material_uploaded',
            entity_type: 'material',
            entity_id: 12,
            details: 'Uploaded notes "Week 2 Supplementary Reading"',
            created_at: daysAgo(1),
            user: { id: 1002, name: 'Demo Teacher', email: 'teacher@demo.lms', role: 'teacher' },
        },
        {
            id: 4,
            user_id: 1001,
            action: 'user_created',
            entity_type: 'user',
            entity_id: 1007,
            details: 'Created student account for Emma Student',
            created_at: daysAgo(0, 8),
            user: { id: 1001, name: 'Demo Principal', email: 'principal@demo.lms', role: 'principal' },
        },
        {
            id: 5,
            user_id: 1001,
            action: 'school_updated',
            entity_type: 'school',
            entity_id: 1,
            details: 'Updated subscription for Eurobliz International School',
            created_at: daysAgo(0, 7),
            user: { id: 1001, name: 'Demo Principal', email: 'principal@demo.lms', role: 'principal' },
        },
    ];
    const filtered = baseLogs.filter((log) =>
        role === 'super_admin' || role === 'principal' ? true : role === 'teacher' ? log.user_id === 1002 : log.user_id === 1003
    );
    const start = (page - 1) * size;
    const items = filtered.slice(start, start + size);
    return { items, total: filtered.length, page, size, pages: Math.max(1, Math.ceil(filtered.length / size)) };
};

const submissionRows = () => [
    {
        id: 51,
        assignment_id: 11,
        student_id: 1007,
        submission_type: 'MCQ',
        title: 'Problem Set 1 — Question Quiz',
        submitted_at: daysAgo(1),
        status: 'evaluated',
        total_score: 42,
        total_marks: 50,
        attempt_number: 1,
        teacher_feedback: 'Great understanding of the core concepts. Review Q3 for the edge cases.',
        student: { id: 1007, name: 'Emma Student', email: 'emma.student@demo.lms' },
    },
    {
        id: 52,
        assignment_id: 11,
        student_id: 1008,
        submission_type: 'MCQ',
        title: 'Problem Set 1 — Question Quiz',
        submitted_at: daysAgo(1),
        status: 'evaluated',
        total_score: 38,
        total_marks: 50,
        attempt_number: 1,
        teacher_feedback: 'Well done. Practice more on attached files handling.',
        student: { id: 1008, name: 'Noah Student', email: 'noah.student@demo.lms' },
    },
    {
        id: 53,
        assignment_id: 22,
        student_id: 1003,
        submission_type: 'FILE_UPLOAD',
        title: 'Lab Report',
        submitted_at: daysAgo(0, 6),
        status: 'submitted',
        file_url: 'https://demo.lms/files/course-2/lab-report.pdf',
        comments: 'Please find my formatted lab report.',
        student: { id: 1003, name: 'Demo Student', email: 'student@demo.lms' },
    },
    {
        id: 54,
        assignment_id: 12,
        student_id: 1009,
        submission_type: 'TEXT',
        title: 'Essay Draft',
        submitted_at: daysAgo(2),
        status: 'evaluated',
        grade: 82,
        total_marks: 100,
        feedback: 'Strong thesis, tighten the conclusion.',
        student: { id: 1009, name: 'Ava Student', email: 'ava.student@demo.lms' },
    },
];

const postsByCourse = (courseId: string) => [
    {
        id: 1,
        course_id: Number(courseId),
        school_id: 1,
        author_id: 1002,
        title: `Welcome to Course ${courseId}!`,
        content: 'Welcome to the course. Review the Week 1 notes and introduce yourself in the discussions below.',
        type: 'ANNOUNCEMENT',
        is_pinned: true,
        created_at: daysAgo(5),
        updated_at: daysAgo(5),
        author_name: 'Demo Teacher',
        replies: [],
    },
    {
        id: 2,
        course_id: Number(courseId),
        school_id: 1,
        author_id: 1003,
        title: 'Question about problem set deadline',
        content: 'Is the deadline strictly enforced or is there a grace period?',
        type: 'QUESTION',
        is_pinned: false,
        created_at: daysAgo(2),
        updated_at: daysAgo(2),
        author_name: 'Demo Student',
        replies: [],
    },
];

const fileRows = (page: number, limit: number) => {
    const files = [
        { object_name: 'course-1/notes-week1.pdf', original_filename: 'notes-week1.pdf', size: 356720, last_modified: daysAgo(14), content_type: 'application/pdf' },
        { object_name: 'course-2/lab-report.pdf', original_filename: 'lab-report.pdf', size: 1204800, last_modified: daysAgo(1), content_type: 'application/pdf' },
        { object_name: 'course-3/experiment-setup.png', original_filename: 'experiment-setup.png', size: 890233, last_modified: daysAgo(9), content_type: 'image/png' },
        { object_name: 'course-4/sql-cheatsheet.docx', original_filename: 'sql-cheatsheet.docx', size: 241909, last_modified: daysAgo(12), content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    ];
    return paginate(files, page, limit);
};

const signupRequests = () => [
    {
        id: 1,
        name: 'Riya Sharma',
        email: 'riya.sharma@demo.lms',
        requested_role: 'teacher',
        approved_role: null,
        status: 'pending',
        school_name: 'Eurobliz International School',
        created_at: daysAgo(1),
        approved_at: null,
    },
    {
        id: 2,
        name: 'Kabir Malhotra',
        email: 'kabir.malhotra@demo.lms',
        requested_role: 'student',
        approved_role: 'student',
        status: 'approved',
        school_name: 'Eurobliz International School',
        created_at: daysAgo(4),
        approved_at: daysAgo(2),
    },
];

const passwordRequests = (page: number, size: number) => {
    const items = [
        {
            id: 1,
            user_id: 1005,
            status: 'pending',
            created_at: daysAgo(1),
            resolved_at: null,
            user: { id: 1005, name: 'Mark Teacher', email: 'mark.teacher@demo.lms', role: 'teacher' },
        },
        {
            id: 2,
            user_id: 1001,
            status: 'approved',
            created_at: daysAgo(3),
            resolved_at: daysAgo(2),
            user: { id: 1001, name: 'Demo Principal', email: 'principal@demo.lms', role: 'principal' },
        },
    ];
    const start = (page - 1) * size;
    return { items: items.slice(start, start + size), total: items.length, page, size };
};

const assignmentDetailsById = (id: string) => {
    const courseId = id.replace(/^a/, '').replace(/\d+$/, '') || '1';
    return {
        id: Number(id.replace(/\D/g, '') || 11),
        title: `Problem Set — Course ${courseId}`,
        course_id: Number(courseId),
        teacher_id: 1002,
        total_marks: 50,
        due_date: daysFromNow(10),
        max_attempts: 3,
        assignment_type: 'MCQ',
        description: 'Complete the multiple choice quiz covering weeks 1-2 content.',
        reference_materials: [{ type: 'link', name: 'Course Readers', url: 'https://demo.lms/readers' }],
        questions: [
            {
                id: 1,
                question_text: 'Which data structure provides O(1) average access by key?',
                question_type: 'MCQ',
                marks: 5,
                order_index: 1,
                options: [
                    { id: 101, option_text: 'Linked List', is_correct: false },
                    { id: 102, option_text: 'Array', is_correct: false },
                    { id: 103, option_text: 'Hash Table', is_correct: true },
                    { id: 104, option_text: 'Stack', is_correct: false },
                ],
            },
            {
                id: 2,
                question_text: 'Time complexity of binary search on a sorted array is:',
                question_type: 'MCQ',
                marks: 5,
                order_index: 2,
                options: [
                    { id: 201, option_text: 'O(n)', is_correct: false },
                    { id: 202, option_text: 'O(log n)', is_correct: true },
                    { id: 203, option_text: 'O(n log n)', is_correct: false },
                    { id: 204, option_text: 'O(1)', is_correct: false },
                ],
            },
            {
                id: 3,
                question_text: 'Explain in one line what a foreign key is:',
                question_type: 'TEXT',
                marks: 5,
                order_index: 3,
                options: [],
            },
        ],
    };
};

const attemptDetail = () => ({
    id: 401,
    student_id: 1007,
    assignment_id: 11,
    attempt_number: 1,
    submitted_at: daysAgo(1),
    total_score: 42,
    total_marks: 50,
    status: 'evaluated',
    answers: [
        {
            question_id: 1,
            selected_option_ids: [103],
            marks_obtained: 5,
            question: {
                id: 1,
                question_text: 'Which data structure provides O(1) average access by key?',
                question_type: 'MCQ',
                marks: 5,
                options: [
                    { id: 101, option_text: 'Linked List', is_correct: false },
                    { id: 102, option_text: 'Array', is_correct: false },
                    { id: 103, option_text: 'Hash Table', is_correct: true },
                    { id: 104, option_text: 'Stack', is_correct: false },
                ],
            },
        },
        {
            question_id: 2,
            selected_option_ids: [202],
            marks_obtained: 5,
            question: {
                id: 2,
                question_text: 'Time complexity of binary search on a sorted array is:',
                question_type: 'MCQ',
                marks: 5,
                options: [
                    { id: 201, option_text: 'O(n)', is_correct: false },
                    { id: 202, option_text: 'O(log n)', is_correct: true },
                    { id: 203, option_text: 'O(n log n)', is_correct: false },
                    { id: 204, option_text: 'O(1)', is_correct: false },
                ],
            },
        },
        {
            question_id: 3,
            answer_text: 'A foreign key is a column that references the primary key of another table.',
            marks_obtained: 4,
            question: { id: 3, question_text: 'Explain in one line what a foreign key is:', question_type: 'TEXT', marks: 5, options: [] },
        },
    ],
});

const schoolsRows = (page: number, limit: number) => {
    const schools = [
        {
            id: 1,
            name: 'Eurobliz International School',
            subscription_start: '2026-01-01',
            subscription_end: '2027-01-01',
            max_teachers: 10,
            created_at: daysAgo(300),
            updated_at: daysAgo(10),
            principal: { id: 1001, name: 'Demo Principal', email: 'principal@demo.lms' },
        },
        {
            id: 2,
            name: 'Springfield Academy',
            subscription_start: '2026-03-01',
            subscription_end: '2027-03-01',
            max_teachers: 6,
            created_at: daysAgo(200),
            updated_at: daysAgo(20),
            principal: undefined,
        },
    ];
    return paginate(schools, page, limit);
};

// Simple route matching: exact paths and dynamic `:id` segments.
const segment = /^(\d+)$/;
const isIdSegment = (part: string): boolean => segment.test(part);

export const resolveDemoMock = (method: string, path: string, params?: Record<string, unknown>): unknown => {
    const role = currentRole();
    const parts = path.split('/').filter(Boolean);
    const page = Number((params as any)?.page) || 1;
    const limit = Number((params as any)?.limit) || 10;
    const size = Number((params as any)?.size) || 20;

    // ---- Stats ----
    if (method === 'get' && path === '/stats/admin') {
        return role === 'student' ? { courses: 3, materials: 8, assignments: 2 } : { courses: 12, materials: 47, assignments: 18 };
    }
    if (method === 'get' && path === '/stats/teacher') {
        return { courses: 2, materials: 8, assignments: 4 };
    }
    if (method === 'get' && path === '/stats/student') {
        return { courses: 3, materials: 8, assignments: 2 };
    }

    // ---- Activity Logs ----
    if (method === 'get' && (path === '/activity-logs/' || path === '/activity-logs')) {
        return logsForRole(role, page, size);
    }
    if (method === 'get' && path === '/activity-logs/my') {
        return logsForRole(role, 1, size);
    }

    // ---- Notifications ----
    if (method === 'get' && path === '/notifications/') {
        return [
            { id: 1, user_id: Number(DEMO_ROLES[role].schoolId) || 1, type: 'assignment_due', message: `Assignment "Problem Set 1" is due in 10 days`, is_read: false, created_at: daysAgo(1) },
            { id: 2, user_id: Number(DEMO_ROLES[role].schoolId) || 1, type: 'material_added', message: 'New notes uploaded to Introduction to Computer Science', is_read: true, created_at: daysAgo(2) },
        ];
    }
    if (method === 'patch' && /^\/notifications\/\d+\/read$/.test(path)) return { detail: 'marked read' };
    if (method === 'patch' && path === '/notifications/read-all') return { detail: 'all read' };

    // ---- Courses ----
    if (method === 'get' && path === '/courses/') {
        const deleted = (params as any)?.deleted === true || (params as any)?.deleted === 'true';
        const source = deleted ? DEMO_COURSES.filter((c) => c.is_deleted) : coursesForRole(role);
        return paginate(source, page, limit);
    }
    if (method === 'get' && parts[0] === 'courses' && parts.length === 2 && isIdSegment(parts[1])) {
        return DEMO_COURSES.find((c) => c.id === parts[1]) || DEMO_COURSES[0];
    }
    if (method === 'post' && path === '/courses/') {
        return { id: '99', name: (params as any)?.name || 'New Course', is_published: false, is_deleted: false };
    }
    if (method === 'patch' && parts[0] === 'courses' && parts.length === 2) return { detail: 'updated' };
    if (method === 'delete' && parts[0] === 'courses' && parts.length === 2) return { detail: 'deleted' };
    if (method === 'post' && parts[0] === 'courses' && parts.length === 3 && parts[2] === 'restore') return { detail: 'restored' };
    if (method === 'delete' && parts[0] === 'courses' && parts.length === 3 && parts[2] === 'permanent') return { detail: 'permanently deleted' };

    // ---- Discussion posts ----
    if (method === 'get' && parts[0] === 'courses' && parts.length === 3 && parts[2] === 'posts') {
        const filtered = postsByCourse(parts[1]);
        const typeFilter = (params as any)?.post_type;
        return typeFilter ? filtered.filter((p) => p.type === typeFilter) : filtered;
    }
    if (method === 'post' && parts[0] === 'courses' && parts.length === 3 && parts[2] === 'posts') {
        return { id: 99, ...(params as any), created_at: new Date().toISOString() };
    }
    if (method === 'get' && parts[0] === 'posts' && parts.length === 2) return postsByCourse('1')[0];
    if (method === 'post' && parts[0] === 'posts' && parts.length === 3 && parts[2] === 'reply') {
        return { id: 999, post_id: Number(parts[1]), content: (params as any)?.content || '', created_at: new Date().toISOString() };
    }

    // ---- Materials ----
    if (method === 'get' && parts[0] === 'materials' && parts[1] === 'course' && parts.length === 3) return materialsForCourse(parts[2]);
    if (method === 'get' && parts[0] === 'materials' && parts[1] === 'teacher' && parts.length === 5) return materialsForCourse(parts[4]);
    if (method === 'post' && parts[0] === 'materials' && parts[1] === 'notes') return { id: 'n99', type: 'notes', created_at: new Date().toISOString() };
    if (method === 'post' && parts[0] === 'materials' && parts[1] === 'assignments') return { id: 'a99', type: 'assignment', created_at: new Date().toISOString() };
    if (method === 'put' && parts[0] === 'materials' && parts.length === 2) return { detail: 'updated' };
    if (method === 'delete' && parts[0] === 'materials' && parts.length === 2) return { detail: 'deleted' };
    if (method === 'post' && parts[0] === 'materials' && parts.length === 3 && parts[2] === 'restore') return { detail: 'restored' };

    // ---- Assignments ----
    if (method === 'get' && parts[0] === 'assignments' && parts.length === 2 && isIdSegment(parts[1])) return assignmentDetailsById(parts[1]);
    if (method === 'get' && parts[0] === 'assignments' && parts.length === 3 && parts[2] === 'attempts') {
        return [attemptDetail()];
    }
    if (method === 'get' && parts[0] === 'assignments' && parts[1] === 'attempts' && parts.length === 3) return attemptDetail();
    if (method === 'post' && path === '/assignments/submit') {
        return { id: 401, total_score: 42, total_marks: 50, attempt_number: 1, status: 'evaluated' };
    }

    // ---- Submissions ----
    if (method === 'get' && parts[0] === 'submissions' && parts[1] === 'student' && parts.length === 3) {
        const rows = submissionRows().filter((s) => s.student_id === Number(parts[2]));
        return { results: rows, total_count: rows.length };
    }
    if (method === 'get' && parts[0] === 'submissions' && parts[1] === 'assignment' && parts.length === 3) {
        return { results: submissionRows(), total_count: submissionRows().length };
    }
    if (method === 'get' && path === '/submissions/teacher') {
        const rows = submissionRows();
        return { results: rows.slice(0, limit), total_count: rows.length };
    }
    if (method === 'post' && path === '/submissions/') {
        return { id: 60, ...(params as any), submitted_at: new Date().toISOString(), status: 'submitted' };
    }
    if (method === 'patch' && parts[0] === 'submissions' && parts.length === 3 && parts[2] === 'grade') {
        return { detail: 'graded' };
    }

    // ---- Users ----
    if (method === 'get' && path === '/users/') {
        const deleted = (params as any)?.deleted === true || (params as any)?.deleted === 'true';
        const active = DEMO_USERS.filter((u) => !u.is_deleted);
        const source = deleted ? DEMO_USERS.filter((u) => u.is_deleted) : active;
        const filtered = role === 'student' ? source.filter((u) => u.role === 'student') : source;
        return paginate(filtered, page, limit);
    }
    if (method === 'get' && parts[0] === 'users' && parts.length === 2) {
        return DEMO_USERS.find((u) => u.id === parts[1]) || DEMO_USERS[0];
    }
    if (method === 'post' && path === '/users/') return { ...(params as any), id: '1099', created_at: new Date().toISOString() };
    if (method === 'patch' && parts[0] === 'users' && parts.length === 2) return { detail: 'updated' };
    if (method === 'delete' && parts[0] === 'users' && parts.length === 2) return { detail: 'deleted' };
    if (method === 'post' && parts[0] === 'users' && parts.length === 3 && parts[2] === 'restore') return { detail: 'restored' };
    if (method === 'delete' && parts[0] === 'users' && parts.length === 3 && parts[2] === 'permanent') return { detail: 'permanently deleted' };

    // ---- Enrollments ----
    if (method === 'get' && path === '/teacher-course/') {
        return [
            { course_id: 1, course_name: 'Introduction to Computer Science', teacher_id: 1002, teacher_name: 'Demo Teacher' },
            { course_id: 2, course_name: 'Mathematics for Engineers', teacher_id: 1002, teacher_name: 'Demo Teacher' },
        ];
    }
    if (method === 'get' && path === '/student-course/') {
        return [
            { course_id: 1, course_name: 'Introduction to Computer Science', student_id: 1003, student_name: 'Demo Student' },
            { course_id: 2, course_name: 'Mathematics for Engineers', student_id: 1003, student_name: 'Demo Student' },
            { course_id: 3, course_name: 'Physics Lab Fundamentals', student_id: 1007, student_name: 'Emma Student' },
        ];
    }
    if (method === 'post' && (path === '/teacher-course/' || path === '/student-course/')) return { detail: 'assigned' };

    // ---- Files ----
    if (method === 'get' && path === '/v1/files/list') return fileRows(page, limit);
    if (method === 'get' && parts[0] === 'v1' && parts[1] === 'files' && parts[2] === 'info') {
        return { object_name: parts.slice(3).join('/'), original_filename: parts[parts.length - 1], size: 1024, last_modified: daysAgo(1), content_type: 'application/octet-stream' };
    }
    if (method === 'post' && path === '/v1/files/presigned-url') return { url: 'https://demo.lms/presigned/demo-download' };
    if (method === 'post' && path === '/v1/files/upload') {
        return { file_url: 'https://demo.lms/files/demo-upload.pdf', size: 2048, object_name: 'demo-upload.pdf' };
    }
    if (method === 'delete' && parts[0] === 'v1' && parts[1] === 'files') return { detail: 'deleted' };

    // ---- Health ----
    if (method === 'get' && path === '/health') {
        return { status: 'ok', database: 'ok', minio: 'ok', timestamp: new Date().toISOString() };
    }

    // ---- Signup requests ----
    if (method === 'get' && (path === '/signup-requests' || path === '/signup-requests/')) {
        const all = signupRequests();
        const showAll = (params as any)?.show_all === true || (params as any)?.show_all === 'true';
        const source = showAll ? all : all.filter((r) => r.status === 'pending');
        const start = (page - 1) * size;
        return { items: source.slice(start, start + size), total: source.length, page, size, pages: Math.max(1, Math.ceil(source.length / size)) };
    }
    if (method === 'patch' && /\/signup-requests\/\d+\.*(approve|reject)$/.test(path)) {
        return { id: Number(path.match(/(\d+)/)?.[1] || 1), status: path.endsWith('/approve') ? 'approved' : 'rejected' };
    }
    if (method === 'post' && path === '/signup') return { id: 3, ...(params as any), status: 'pending', created_at: new Date().toISOString() };

    // ---- Password requests ----
    if (method === 'get' && path.startsWith('/auth/password-requests')) {
        return passwordRequests(page, size);
    }
    if (method === 'patch' && /\/auth\/password-requests\/\d+\/(approve|reject)$/.test(path)) return { detail: 'resolved' };

    // ---- Schools ----
    if (method === 'get' && (path === '/schools/' || path === '/schools')) return schoolsRows(page, limit);
    if (method === 'get' && path === '/schools/public') return paginate(schoolsRows(1, 100).items, page, limit);
    if (method === 'get' && parts[0] === 'schools' && parts.length === 2) return schoolsRows(1, 100).items[0];
    if (method === 'post' && path === '/schools/') return { id: 9, ...(params as any) };
    if (method === 'patch' && parts[0] === 'schools' && parts.length === 2) return { detail: 'updated' };
    if (method === 'post' && /\/schools\/\d+\/assign-principal$/.test(path)) return { detail: 'principal assigned' };

    // ---- Auth (never reaches the network in demo mode) ----
    if (method === 'post' && path === '/auth/login') return demoTokenResponse(role);
    if (method === 'post' && path === '/auth/refresh') return demoTokenResponse(role);
    if (method === 'post' && path === '/auth/logout') return { detail: 'logged out' };
    if (method === 'post' && path === '/auth/switch-role') {
        const targetRole = (params as any)?.target_role as DemoRole;
        return targetRole ? demoTokenResponse(targetRole) : demoTokenResponse(role);
    }
    if (method === 'post' && (path === '/auth/change-password' || path === '/auth/public-change-password')) return { detail: 'password changed' };

    // ---- AI ----
    if (path.startsWith('/ai/')) {
        return 'This is a demo-mode AI response generated entirely on the frontend.\n\nIt explains the requested topic with sample outline points, key concepts, and practice suggestions.';
    }

    // ---- Generic fallbacks (never hit the real backend) ----
    if (method === 'get' || method === 'head') {
        const looksPaginated = path.includes('list') || path.includes('requests') || path.endsWith('/') || path.includes('logs') || path.includes('notifications');
        if (looksPaginated) return { items: [], total: 0, page, limit, pages: 0 };
        return {};
    }
    return { detail: 'ok' };
};