import React from 'react';
import { useParams, Link, useLocation, useSearch, useNavigate } from '@tanstack/react-router';
import { useCourseQuery } from '../hooks/useCourses';
import { useTeacherAssignmentsQuery, useStudentEnrollmentsQuery } from '../../enrollments/hooks/useEnrollments';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { Table } from '../../../shared/components/ui/Table';
import { useAuthStore } from '../../../app/store/authStore';

export const CourseDetailPage: React.FC = () => {
    const { courseId } = useParams({ strict: false }) as { courseId: string };
    const { pathname } = useLocation();
    const { tab } = useSearch({ strict: false }) as { tab?: 'materials' | 'assignments' };
    const navigate = useNavigate();

    const activeTab = tab || 'materials';
    const setActiveTab = (newTab: 'materials' | 'assignments') => {
        // Use generic path-based navigation to bypass strict route checking for dynamic paths
        const basePath = pathname.startsWith('/teacher') ? `/teacher/courses/${courseId}` : `/principal/courses/${courseId}`;
        navigate({
            to: basePath as any,
            search: { tab: newTab } as any,
            replace: true
        });
    };

    // Choose back link based on current path prefix
    const backLink = pathname.startsWith('/teacher') ? '/teacher/courses' : '/principal/courses';

    const { userRole } = useAuthStore();

    const { data: course, isLoading: isLoadingCourse, isError, error } = useCourseQuery(courseId);
    const { data: teacherAssignments, isLoading: isLoadingTeachers } = useTeacherAssignmentsQuery(userRole || undefined);
    const { data: studentEnrollments, isLoading: isLoadingStudents } = useStudentEnrollmentsQuery(userRole || undefined);
    const { data: materials, isLoading: isLoadingMaterials } = useCourseMaterialsQuery(courseId);

    if (isLoadingCourse) return <div className="p-8 text-slate-500 animate-pulse font-bold">Loading course details...</div>;
    if (isError) return <div className="p-8 text-red-500 font-bold bg-red-50 rounded-xl border border-red-100">Failed to load course: {error?.message}</div>;
    if (!course) return <div className="p-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">Course not found.</div>;

    const assignedTeachers = teacherAssignments?.filter((ta: any) => String(ta.course_id) === String(courseId)) || [];
    const enrolledStudents = studentEnrollments?.filter((se: any) => String(se.course_id) === String(courseId)) || [];

    const allMaterials = materials || [];
    const assignmentMaterials = allMaterials.filter((m: any) => m.type === 'assignment');
    const readingMaterials = allMaterials.filter((m: any) => m.type !== 'assignment');

    const tabs = [
        { id: 'materials' as const, label: '📚 Materials', count: readingMaterials.length },
        { id: 'assignments' as const, label: '📝 Assignments', count: assignmentMaterials.length },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-100">
                <div className="space-y-2">
                    <Link to={backLink} className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors group">
                        <span className="group-hover:-translate-x-1 transition-transform mr-1">←</span> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">{course.name}</h1>
                    <p className="text-slate-500 font-medium max-w-3xl leading-relaxed">{course.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${course.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {course.is_published ? 'Published' : 'Draft Mode'}
                    </span>
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${course.is_deleted ? 'bg-red-50 text-red-700 border-red-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                        {course.is_deleted ? 'Archived' : 'Active'}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </div>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 animate-in slide-in-from-bottom-1" />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'materials' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-inner">👨‍🏫</div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{assignedTeachers.length}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Instructors</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-inner">🎓</div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{enrolledStudents.length}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Enrolled</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-inner">📚</div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{readingMaterials.length}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Reading Materials</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                                <span>Instructors</span>
                                <div className="h-px flex-1 bg-slate-50"></div>
                            </h2>
                            <Table
                                data={assignedTeachers}
                                isLoading={isLoadingTeachers}
                                columns={[
                                    { header: 'Teacher', accessorKey: 'teacher_name', cell: ({ row }) => <span className="font-bold text-slate-700">{row.teacher_name}</span> }
                                ]}
                                emptyMessage="No teachers assigned to this course."
                            />
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                                <span>Student Roster</span>
                                <div className="h-px flex-1 bg-slate-50"></div>
                            </h2>
                            <Table
                                data={enrolledStudents}
                                isLoading={isLoadingStudents}
                                columns={[
                                    { header: 'Student', accessorKey: 'student_name', cell: ({ row }) => <span className="font-bold text-slate-700">{row.student_name}</span> }
                                ]}
                                emptyMessage="No students currently enrolled."
                            />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                            <span>Curriculum Materials</span>
                            <div className="h-px flex-1 bg-slate-50"></div>
                        </h2>
                        <Table
                            data={readingMaterials}
                            isLoading={isLoadingMaterials}
                            columns={[
                                { header: 'Title', accessorKey: 'title', cell: ({ row }: any) => <span className="font-bold text-slate-700">{row.title}</span> },
                                {
                                    header: 'Type',
                                    cell: ({ row }: any) => (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${row.file_url ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                            {row.file_url ? 'Reading' : 'Assignment'}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Added On',
                                    cell: ({ row }: any) => (
                                        <span className="text-slate-400 text-xs font-medium">
                                            {row.created_at ? new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                        </span>
                                    )
                                }
                            ]}
                            emptyMessage="No reading materials uploaded yet."
                        />
                    </div>
                </div>
            )}

            {activeTab === 'assignments' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                            <span>Course Assignments</span>
                            <div className="h-px flex-1 bg-slate-50"></div>
                        </h2>
                        <Table
                            data={assignmentMaterials}
                            isLoading={isLoadingMaterials}
                            columns={[
                                { header: 'Assignment Title', accessorKey: 'title', cell: ({ row }: any) => <span className="font-bold text-slate-700">{row.title}</span> },
                                {
                                    header: 'Format',
                                    cell: ({ row }: any) => {
                                        let FormatIcon = '📄';
                                        let FormatText = 'Document';
                                        if (row.assignment_type === 'MCQ') { FormatIcon = '✅'; FormatText = 'Multiple Choice'; }
                                        if (row.assignment_type === 'TEXT') { FormatIcon = '✍️'; FormatText = 'Written Response'; }
                                        return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                <span>{FormatIcon}</span>
                                                {FormatText}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    header: 'Status & Deadline',
                                    cell: ({ row }: any) => (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-700 text-sm font-semibold">
                                                {row.due_date ? new Date(row.due_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date'}
                                            </span>
                                            <span className="text-rose-600 text-[10px] font-black uppercase tracking-widest">{row.total_marks || 0} Total Marks</span>
                                        </div>
                                    )
                                }
                            ]}
                            emptyMessage="No assignments created for this course yet."
                        />
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md">🚀</div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Assignment Management</h3>
                                <p className="text-indigo-100 text-sm mt-1 font-medium opacity-90">Detailed grading and submission tracking is available in the dedicated Assignment module.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
