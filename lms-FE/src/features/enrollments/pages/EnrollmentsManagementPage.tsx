import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignTeacherSchema, enrollStudentSchema, type AssignTeacherData, type EnrollStudentData } from '../schemas';
import { useAssignTeacherMutation, useEnrollStudentMutation, useTeacherAssignmentsQuery, useStudentEnrollmentsQuery } from '../hooks/useEnrollments';
import { useUsersQuery } from '../../users/hooks/useUsers';
import { useCoursesQuery } from '../../courses/hooks/useCourses';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { Table } from '../../../shared/components/ui/Table';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';

export const EnrollmentsManagementPage: React.FC = () => {
    const { data: users, isLoading: isLoadingUsers } = useUsersQuery();
    const { data: courses, isLoading: isLoadingCourses } = useCoursesQuery();

    const { addToast } = useToastStore();
    const assignTeacherMutation = useAssignTeacherMutation();
    const enrollStudentMutation = useEnrollStudentMutation();

    const { data: teacherAssignments, isLoading: isLoadingTeacherAssignments } = useTeacherAssignmentsQuery();
    const { data: studentEnrollments, isLoading: isLoadingStudentEnrollments } = useStudentEnrollmentsQuery();

    const {
        register: registerTeacher,
        handleSubmit: handleTeacherSubmit,
        reset: resetTeacher,
        formState: { errors: teacherErrors },
    } = useForm<AssignTeacherData>({
        resolver: zodResolver(assignTeacherSchema),
    });

    const {
        register: registerStudent,
        handleSubmit: handleStudentSubmit,
        reset: resetStudent,
        formState: { errors: studentErrors },
    } = useForm<EnrollStudentData>({
        resolver: zodResolver(enrollStudentSchema),
    });

    const onAssignTeacher = (data: AssignTeacherData) => {
        assignTeacherMutation.mutate(data, {
            onSuccess: () => {
                addToast('Teacher successfully assigned to course', 'success');
                resetTeacher();
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to assign teacher'), 'error');
            }
        });
    };

    const onEnrollStudent = (data: EnrollStudentData) => {
        enrollStudentMutation.mutate(data, {
            onSuccess: () => {
                addToast('Student successfully enrolled in course', 'success');
                resetStudent();
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to enroll student'), 'error');
            }
        });
    };

    if (isLoadingUsers || isLoadingCourses) {
        return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading system data...</div>;
    }

    const teachers = users?.filter(u => u.role === 'teacher') || [];
    const students = users?.filter(u => u.role === 'student') || [];

    const courseOptions = (courses || []).map(c => ({ value: c.id, label: c.name }));
    const teacherOptions = teachers.map(t => ({ value: t.id, label: `${t.name} (${t.email})` }));
    const studentOptions = students.map(s => ({ value: s.id, label: `${s.name} (${s.email})` }));

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Enrollments & Assignments</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Teacher Assignment Panel */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Assign Teacher to Course</h2>
                        <p className="text-sm text-slate-500 mt-1">Select a teacher and link them to an active module.</p>
                    </div>

                    <form onSubmit={handleTeacherSubmit(onAssignTeacher)} className="space-y-4">
                        <FormSelect
                            label="Select Teacher"
                            register={registerTeacher('teacher_id')}
                            options={[
                                { value: '', label: 'Choose a teacher...' },
                                ...teacherOptions
                            ]}
                            error={teacherErrors.teacher_id?.message}
                        />

                        <FormSelect
                            label="Select Course"
                            register={registerTeacher('course_id')}
                            options={[
                                { value: '', label: 'Choose a course...' },
                                ...courseOptions
                            ]}
                            error={teacherErrors.course_id?.message}
                        />

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" isLoading={assignTeacherMutation.isPending}>
                                Assign Teacher
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Student Enrollment Panel */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Enroll Student in Course</h2>
                        <p className="text-sm text-slate-500 mt-1">Grant a student access to a module's content.</p>
                    </div>

                    <form onSubmit={handleStudentSubmit(onEnrollStudent)} className="space-y-4">
                        <FormSelect
                            label="Select Student"
                            register={registerStudent('student_id')}
                            options={[
                                { value: '', label: 'Choose a student...' },
                                ...studentOptions
                            ]}
                            error={studentErrors.student_id?.message}
                        />

                        <FormSelect
                            label="Select Course"
                            register={registerStudent('course_id')}
                            options={[
                                { value: '', label: 'Choose a course...' },
                                ...courseOptions
                            ]}
                            error={studentErrors.course_id?.message}
                        />

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" isLoading={enrollStudentMutation.isPending} variant="primary">
                                Enroll Student
                            </Button>
                        </div>
                    </form>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                {/* Teacher Assignments Table */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Current Teacher Assignments</h2>
                    <Table
                        data={teacherAssignments || []}
                        isLoading={isLoadingTeacherAssignments}
                        columns={[
                            { header: 'Teacher', accessorKey: 'teacher_name', cell: ({ row }) => <span className="font-medium text-slate-800">{row.teacher_name}</span> },
                            { header: 'Course', accessorKey: 'course_name', cell: ({ row }) => <span className="text-indigo-600 font-medium">{row.course_name}</span> }
                        ]}
                        emptyMessage="No teacher assignments found."
                    />
                </div>

                {/* Student Enrollments Table */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Current Student Enrollments</h2>
                    <Table
                        data={studentEnrollments || []}
                        isLoading={isLoadingStudentEnrollments}
                        columns={[
                            { header: 'Student', accessorKey: 'student_name', cell: ({ row }) => <span className="font-medium text-slate-800">{row.student_name}</span> },
                            { header: 'Course', accessorKey: 'course_name', cell: ({ row }) => <span className="text-emerald-600 font-medium">{row.course_name}</span> }
                        ]}
                        emptyMessage="No student enrollments found."
                    />
                </div>
            </div>
        </div>
    );
};
