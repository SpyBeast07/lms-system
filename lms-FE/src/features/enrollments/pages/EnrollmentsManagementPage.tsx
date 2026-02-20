import React from 'react';
import { useTeacherAssignmentsQuery, useStudentEnrollmentsQuery } from '../hooks/useEnrollments';
import { Table } from '../../../shared/components/ui/Table';
import { AssignTeacherForm } from '../components/AssignTeacherForm';
import { EnrollStudentForm } from '../components/EnrollStudentForm';

export const EnrollmentsManagementPage: React.FC = () => {
    const { data: teacherAssignments, isLoading: isLoadingTeacherAssignments } = useTeacherAssignmentsQuery();
    const { data: studentEnrollments, isLoading: isLoadingStudentEnrollments } = useStudentEnrollmentsQuery();

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
                    <AssignTeacherForm />
                </div>

                {/* Student Enrollment Panel */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Enroll Student in Course</h2>
                        <p className="text-sm text-slate-500 mt-1">Grant a student access to a module's content.</p>
                    </div>
                    <EnrollStudentForm />
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
