import React from 'react';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { Table } from '../../../shared/components/ui/Table';
import type { Course } from '../../courses/schemas';

export const StudentCoursesPage: React.FC = () => {
    const { data: courses, isLoading, isError, error } = useStudentCourses();

    const columns = [
        {
            header: 'Course Title',
            accessorKey: 'title' as keyof Course,
            cell: ({ row }: { row: Course }) => <span className="font-medium text-slate-800">{row.title}</span>
        },
        {
            header: 'Description',
            accessorKey: 'description' as keyof Course,
            cell: ({ row }: { row: Course }) => <div className="max-w-sm truncate">{row.description || '-'}</div>
        },
        {
            header: 'Instructor',
            cell: ({ row }: { row: any }) => (
                <span className="text-slate-600 font-medium">
                    {row.instructor_id ? `ID: ${row.instructor_id.substring(0, 8)}...` : 'Unassigned'}
                </span>
            )
        },
        {
            header: 'Status',
            cell: ({ row }: { row: Course }) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Enrolled
                </span>
            )
        }
    ];

    if (isLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading your courses...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load courses: {(error as any)?.message}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Learning Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Access all courses you have been successfully enrolled in.</p>
                </div>
            </div>

            <Table<Course>
                data={courses || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="You are not enrolled in any courses yet."
            />
        </div>
    );
};
