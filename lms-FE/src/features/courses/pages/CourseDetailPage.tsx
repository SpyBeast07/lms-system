import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useCourseQuery } from '../hooks/useCourses';
import { useTeacherAssignmentsQuery, useStudentEnrollmentsQuery } from '../../enrollments/hooks/useEnrollments';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { Table } from '../../../shared/components/ui/Table';

export const CourseDetailPage: React.FC = () => {
    const { courseId } = useParams({ strict: false }) as { courseId: string };

    const { data: course, isLoading: isLoadingCourse, isError, error } = useCourseQuery(courseId);
    const { data: teacherAssignments, isLoading: isLoadingTeachers } = useTeacherAssignmentsQuery();
    const { data: studentEnrollments, isLoading: isLoadingStudents } = useStudentEnrollmentsQuery();
    const { data: materials, isLoading: isLoadingMaterials } = useCourseMaterialsQuery(courseId);

    if (isLoadingCourse) return <div className="p-8 text-slate-500 animate-pulse">Loading course details...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load course: {error?.message}</div>;
    if (!course) return <div className="p-8 text-slate-500">Course not found.</div>;

    const assignedTeachers = teacherAssignments?.filter((ta: any) => String(ta.course_id) === String(courseId)) || [];
    const enrolledStudents = studentEnrollments?.filter((se: any) => String(se.course_id) === String(courseId)) || [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link to={'/principal/courses'} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                            ← Back to Courses
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{course.name}</h1>
                    <p className="mt-2 text-slate-600 max-w-2xl">{course.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${course.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {course.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${course.is_deleted ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                        {course.is_deleted ? 'Archived' : 'Active'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl mb-3">👨‍🏫</div>
                    <h3 className="text-3xl font-bold text-slate-800">{assignedTeachers.length}</h3>
                    <p className="text-sm font-medium text-slate-500 uppercase mt-1">Assigned Teachers</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl mb-3">🎓</div>
                    <h3 className="text-3xl font-bold text-slate-800">{enrolledStudents.length}</h3>
                    <p className="text-sm font-medium text-slate-500 uppercase mt-1">Enrolled Students</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl mb-3">📚</div>
                    <h3 className="text-3xl font-bold text-slate-800">{materials?.length || 0}</h3>
                    <p className="text-sm font-medium text-slate-500 uppercase mt-1">Total Materials</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Assigned Instructors</h2>
                    <Table
                        data={assignedTeachers}
                        isLoading={isLoadingTeachers}
                        columns={[
                            { header: 'Teacher', accessorKey: 'teacher_name', cell: ({ row }) => <span className="font-medium text-slate-800">{row.teacher_name}</span> }
                        ]}
                        emptyMessage="No teachers assigned to this course."
                    />
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Enrolled Roster</h2>
                    <Table
                        data={enrolledStudents}
                        isLoading={isLoadingStudents}
                        columns={[
                            { header: 'Student', accessorKey: 'student_name', cell: ({ row }) => <span className="font-medium text-slate-800">{row.student_name}</span> }
                        ]}
                        emptyMessage="No students currently enrolled."
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Curriculum Materials</h2>
                <Table
                    data={materials || []}
                    isLoading={isLoadingMaterials}
                    columns={[
                        { header: 'Title', accessorKey: 'title', cell: ({ row }: any) => <span className="font-medium text-slate-800">{row.title}</span> },
                        {
                            header: 'Type',
                            cell: ({ row }: any) => (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.file_url ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                    {row.file_url ? 'Note/File' : 'Assignment'}
                                </span>
                            )
                        },
                        {
                            header: 'Added On',
                            cell: ({ row }: any) => (
                                <span className="text-slate-500 text-sm">
                                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                                </span>
                            )
                        }
                    ]}
                    emptyMessage="Course empty. No materials uploaded."
                />
            </div>
        </div>
    );
};
