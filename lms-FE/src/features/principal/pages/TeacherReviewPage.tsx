import React, { useState } from 'react';
import { useUsersQuery } from '../../users/hooks/useUsers';
import { useTeacherAssignmentsQuery } from '../../enrollments/hooks/useEnrollments';
import { useTeacherMaterialsQuery } from '../../materials/hooks/useMaterials';
import { useActivityLogsQuery } from '../../activityLogs/hooks/useActivityLogs';
import { Table } from '../../../shared/components/ui/Table';

export const TeacherReviewPage: React.FC = () => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    // 1. Fetch Teachers
    const { data: usersData } = useUsersQuery(1, 1000);
    const teachers = (usersData as any)?.items?.filter((u: any) => u.role === 'teacher') || [];

    // 2. Fetch All Teacher-Course Assignments
    const { data: assignments } = useTeacherAssignmentsQuery();

    // Filter courses for the selected teacher
    const assignedCourses = assignments?.filter((a: any) => String(a.teacher_id) === String(selectedTeacherId)) || [];

    // 3. Fetch Materials for the selected Teacher + Course
    const { data: materials, isLoading: isLoadingMaterials } = useTeacherMaterialsQuery(selectedTeacherId, selectedCourseId);

    // 4. Fetch Activity Logs for the selected Teacher
    const { data: logs, isLoading: isLoadingLogs } = useActivityLogsQuery({
        user_id: selectedTeacherId ? Number(selectedTeacherId) : undefined,
        size: 50
    });

    const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTeacherId(e.target.value);
        setSelectedCourseId('');
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="pb-6 border-b border-slate-200">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Teacher Activity Review</h1>
                <p className="mt-2 text-slate-600">Monitor instructional content, assignments, and performance metrics across departments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">1. Select Instructor</label>
                    <select
                        value={selectedTeacherId}
                        onChange={handleTeacherChange}
                        className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                        <option value="">Choose a teacher...</option>
                        {teachers.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">2. Select Assigned Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        disabled={!selectedTeacherId}
                        className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">Choose a course...</option>
                        {assignedCourses.map((c: any) => (
                            <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedTeacherId && selectedCourseId ? (
                <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Activity Timeline Integration (Summary) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>📋</span> Evaluation & Grading Audit
                        </h2>
                        <Table
                            data={(logs as any)?.items?.filter((l: any) => l.action.includes('grade')) || []}
                            isLoading={isLoadingLogs}
                            columns={[
                                { header: 'Action', accessorKey: 'action', cell: ({ row }: any) => <span className="capitalize font-medium text-indigo-600">{row.action.replace('_', ' ')}</span> },
                                { header: 'Details', accessorKey: 'details', cell: ({ row }: any) => <span className="text-slate-600 text-sm">{row.details}</span> },
                                { header: 'Date', accessorKey: 'created_at', cell: ({ row }: any) => <span className="text-slate-400 text-xs">{new Date(row.created_at).toLocaleString()}</span> }
                            ]}
                            emptyMessage="No evaluation activity recorded for this instructor yet."
                        />
                    </div>

                    {/* Course Materials Audit */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>📚</span> Curriculum & Materials Review
                        </h2>
                        <Table
                            data={materials || []}
                            isLoading={isLoadingMaterials}
                            columns={[
                                { header: 'Title', accessorKey: 'title', cell: ({ row }: any) => <span className="font-semibold text-slate-800">{row.title}</span> },
                                {
                                    header: 'Type',
                                    cell: ({ row }: any) => (
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${row.type === 'notes' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {row.type}
                                        </span>
                                    )
                                },
                                { header: 'Upload Date', cell: ({ row }: any) => <span className="text-slate-500 text-sm">{new Date(row.created_at).toLocaleDateString()}</span> },
                                {
                                    header: 'Content',
                                    cell: ({ row }: any) => row.file_url ? (
                                        <a href={row.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline text-sm font-medium">Open File</a>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">Assignment Specs</span>
                                    )
                                }
                            ]}
                            emptyMessage="This instructor hasn't uploaded any materials for this module yet."
                        />
                    </div>
                </div>
            ) : selectedTeacherId && (
                <div className="bg-indigo-50 p-12 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">📍</div>
                    <h3 className="text-xl font-bold text-indigo-900">Course Selection Required</h3>
                    <p className="text-indigo-600 mt-1 max-w-sm">Please select one of the instructor's assigned modules to drill down into their specific curriculum and evaluations.</p>
                </div>
            )}

            {!selectedTeacherId && (
                <div className="bg-slate-100 p-20 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-200">
                    <div className="text-5xl mb-6 opacity-40">🕵️‍♂️</div>
                    <h3 className="text-xl font-bold text-slate-400">Audit Mode Inactive</h3>
                    <p className="text-slate-400 mt-1">Select an instructor from the dropdown above to begin systemic review.</p>
                </div>
            )}
        </div>
    );
};
