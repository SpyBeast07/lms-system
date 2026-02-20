import React, { useState } from 'react';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { Table } from '../../../shared/components/ui/Table';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { Link } from '@tanstack/react-router';
import { DashboardSummary } from '../../../shared/components/widgets/DashboardSummary';
import { ActivityTimeline } from '../../../shared/components/widgets/ActivityTimeline';
import type { Course } from '../../courses/schemas';

const CourseCountsCell = ({ courseId }: { courseId: string }) => {
    const { data: materials, isLoading: isLoadingMaterials } = useCourseMaterialsQuery(courseId);
    if (isLoadingMaterials) return <span className="text-slate-400 text-xs animate-pulse">Loading...</span>;

    const notesCount = materials?.filter((m: any) => m.file_url).length || 0;
    const assignCount = materials?.filter((m: any) => !m.file_url).length || 0;

    return (
        <div className="flex gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                <span>📚</span>
                <span>{notesCount} Notes</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2 py-1 rounded">
                <span>📝</span>
                <span>{assignCount} Assignments</span>
            </div>
        </div>
    );
};


export const StudentCoursesPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const limit = 10;
    const { data: courses, isLoading, isError, error } = useStudentCourses(page, limit);

    const columns = [
        {
            header: 'Course Name',
            accessorKey: 'name' as keyof Course,
            cell: ({ row }: { row: Course }) => (
                <div>
                    <span className="font-medium text-slate-800 block">{row.name}</span>
                    <span className="text-xs text-slate-500 max-w-xs truncate block mt-0.5">{row.description || 'No description'}</span>
                </div>
            )
        },
        {
            header: 'Available Curriculum',
            cell: ({ row }: { row: Course }) => <CourseCountsCell courseId={row.id.toString()} />
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: Course }) => (
                <div className="flex justify-start">
                    <Link
                        to="/student/courses/$courseId"
                        params={{ courseId: row.id.toString() }}
                        className="text-white hover:bg-slate-800 bg-slate-900 font-medium text-sm transition-colors px-4 py-2 rounded shadow-sm"
                    >
                        Go to Classroom
                    </Link>
                </div>
            )
        }
    ];

    const mockActivities = [
        { id: '1', title: 'Assignment Submitted', description: 'You successfully submitted Calculus Midterm.', timestamp: new Date(Date.now() - 3600000), type: 'assignment' as const },
        { id: '2', title: 'Enrolled in Course', description: 'You were enrolled in Computer Science 101.', timestamp: new Date(Date.now() - 172800000), type: 'course' as const },
    ];

    if (isLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading your courses...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load courses: {(error as any)?.message}</div>;

    const allCourses = (courses as any)?.items || [];

    return (
        <div className="space-y-8 pb-12">
            <DashboardSummary
                courseCount={(courses as any)?.total || 0}
                materialCount={38} // Simulated metric based on sum 
                assignmentCount={4} // Simulated metric
                isLoading={isLoading}
            />

            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Learning Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Access all courses you have been successfully enrolled in.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table<Course>
                    data={allCourses}
                    columns={columns}
                    emptyMessage="You are not enrolled in any courses yet."
                />
                <Pagination
                    currentPage={page}
                    totalItems={(courses as any)?.total || 0}
                    pageSize={limit}
                    onPageChange={setPage}
                    isLoading={isLoading}
                />
            </div>

            <div className="pt-4">
                <ActivityTimeline activities={mockActivities} />
            </div>
        </div>
    );
};
