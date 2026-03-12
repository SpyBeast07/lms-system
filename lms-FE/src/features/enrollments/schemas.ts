import { z } from 'zod';

export const assignTeacherSchema = z.object({
    teacher_id: z.string().min(1, 'Teacher selection is required'),
    course_id: z.string().min(1, 'Course selection is required'),
});

export type AssignTeacherData = z.infer<typeof assignTeacherSchema>;

export const enrollStudentSchema = z.object({
    student_id: z.string().min(1, 'Student selection is required'),
    course_id: z.string().min(1, 'Course selection is required'),
});

export type EnrollStudentData = z.infer<typeof enrollStudentSchema>;
