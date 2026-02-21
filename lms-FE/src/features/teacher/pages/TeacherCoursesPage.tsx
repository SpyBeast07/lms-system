import React, { useState } from 'react';
import { useTeacherCourses } from '../hooks/useTeacherCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { Table } from '../../../shared/components/ui/Table';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { Link } from '@tanstack/react-router';
import { DashboardSummary } from '../../../shared/components/widgets/DashboardSummary';
import { ActivityTimeline } from '../../../shared/components/widgets/ActivityTimeline';
import { useTeacherStatsQuery } from '../../../shared/hooks/useStats';
import { useMyActivityLogsQuery } from '../../activityLogs/hooks/useActivityLogs';
import type { Course } from '../../courses/schemas';

const CourseCountsCell = ({ courseId }: { courseId: string }) => {
    const { data: materials, isLoading } = useCourseMaterialsQuery(courseId);
    if (isLoading) return <span className="text-slate-400 text-xs animate-pulse">Loading...</span>;

    // Notes have a type='notes'
    const notesCount = materials?.filter((m: any) => m.type === 'notes').length || 0;
    const assignCount = materials?.filter((m: any) => m.type === 'assignment').length || 0;

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

export const TeacherCoursesPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const limit = 10;
    const { data, isLoading, isError, error } = useTeacherCourses(page, limit);
    const { data: stats, isLoading: isLoadingStats } = useTeacherStatsQuery();
    const { data: myLogs, isLoading: isLoadingLogs } = useMyActivityLogsQuery(8);

    const activities = myLogs?.items?.slice(0, 8).map((log: any) => ({
        id: log.id.toString(),
        title: log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: log.details || `${log.entity_type} #${log.entity_id}`,
        timestamp: new Date(log.created_at),
        type: (log.action.includes('assignment') ? 'assignment' :
            log.action.includes('course') ? 'course' :
                log.action.includes('notes') || log.action.includes('material') ? 'material' : 'system') as 'course' | 'material' | 'assignment' | 'system'
    })) || [];

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
            header: 'Enrolled Metrics',
            cell: ({ row }: { row: Course }) => <CourseCountsCell courseId={row.id.toString()} />
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
            header: 'Quick Actions',
            cell: () => (
                <div className="flex gap-2">
                    <Link
                        to="/teacher/upload-notes"
                        className="text-xs font-medium px-2 py-1 bg-white border border-slate-200 shadow-sm rounded hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                        + Upload File
                    </Link>
                    <Link
                        to="/teacher/create-assignment"
                        className="text-xs font-medium px-2 py-1 bg-indigo-50 border border-indigo-100 shadow-sm rounded hover:bg-indigo-100 text-indigo-700 transition-colors"
                    >
                        + New Assignment
                    </Link>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading assigned courses...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load courses: {(error as any)?.message}</div>;

    const coursesList = (data as any)?.items || [];

    return (
        <div className="space-y-8 pb-12">
            <DashboardSummary
                courseCount={stats?.courses || 0}
                materialCount={stats?.materials || 0}
                assignmentCount={stats?.assignments || 0}
                isLoading={isLoadingStats}
            />

            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Assigned Courses</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage modules you are actively instructing.</p>
                </div>
                <Link
                    to="/teacher/materials"
                    className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm"
                >
                    Manage All Materials
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table<Course>
                    data={coursesList}
                    columns={columns}
                    emptyMessage="You have not been assigned any courses yet."
                />
                <Pagination
                    currentPage={page}
                    totalItems={(data as any)?.total || 0}
                    pageSize={limit}
                    onPageChange={setPage}
                    isLoading={isLoading}
                />
            </div>

            <div className="pt-4">
                <ActivityTimeline activities={activities} isLoading={isLoadingLogs} />
            </div>
        </div>
    );
};
