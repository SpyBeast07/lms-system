import React from 'react';
import { useTeacherCourses } from '../hooks/useTeacherCourses';
import { Table } from '../../../shared/components/ui/Table';
import type { Course } from '../../courses/schemas';

export const TeacherCoursesPage: React.FC = () => {
    const { data: courses, isLoading, isError, error } = useTeacherCourses();

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
            header: 'Status',
            cell: ({ row }: { row: Course }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {row.is_published ? 'Published' : 'Draft'}
                </span>
            )
        },
        {
            header: 'Created On',
            cell: ({ row }: { row: Course }) => (
                <span className="text-slate-500 text-sm">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                </span>
            )
        }
    ];

    if (isLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading assigned courses...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load courses: {(error as any)?.message}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Assigned Courses</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage modules you are actively instructing.</p>
                </div>
            </div>

            <Table<Course>
                data={courses || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="You have not been assigned any courses yet."
            />
        </div>
    );
};
