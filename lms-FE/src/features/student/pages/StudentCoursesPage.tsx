import React from 'react';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { useTeacherAssignmentsQuery } from '../../enrollments/hooks/useEnrollments';
import { Table } from '../../../shared/components/ui/Table';
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

const InstructorCell = ({ courseId }: { courseId: string }) => {
    const { data: assignments, isLoading } = useTeacherAssignmentsQuery();
    if (isLoading) return <span className="text-slate-400 text-xs animate-pulse">Loading...</span>;

    // Find the teacher assigned to this course
    const teacher = assignments?.find((a: any) => a.course_id === courseId);

    return (
        <span className="text-slate-600 font-medium text-sm">
            {teacher ? teacher.teacher_name : <span className="text-slate-400 italic">Unassigned</span>}
        </span>
    );
};

export const StudentCoursesPage: React.FC = () => {
    const { data: courses, isLoading, isError, error } = useStudentCourses();

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
            header: 'Instructor',
            cell: ({ row }: { row: Course }) => <InstructorCell courseId={row.id.toString()} />
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

    return (
        <div className="space-y-8">
            <DashboardSummary
                courseCount={courses?.length || 0}
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

            <Table<Course>
                data={courses || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="You are not enrolled in any courses yet."
            />

            <div className="pt-4">
                <ActivityTimeline activities={mockActivities} />
            </div>
        </div>
    );
};
