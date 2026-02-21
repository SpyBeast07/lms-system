import React, { useState } from 'react';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { DownloadButton } from '../components/DownloadButton';
import { Link } from '@tanstack/react-router';

export const CourseMaterialsPage: React.FC = () => {
    const { data: courses, isLoading: isCoursesLoading } = useStudentCourses();
    const [selectedCourse, setSelectedCourse] = useState<string>('');

    const { data: materials, isLoading, isError } = useCourseMaterialsQuery(selectedCourse);

    if (isCoursesLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading your curriculum...</div>;

    const notes = materials?.filter((m: any) => m.file_url) || [];
    const assignments = materials?.filter((m: any) => !m.file_url) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Learning Materials & Assignments</h1>
                    <p className="text-sm text-slate-500 mt-1">Select an enrolled course to view its curriculum.</p>
                </div>
            </div>

            <div className="max-w-md">
                <label htmlFor="course-select" className="block text-sm font-medium text-slate-700 mb-1">Select Course</label>
                <select
                    id="course-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 bg-white border"
                >
                    <option value="">Choose a course...</option>
                    {((courses as any)?.items || (Array.isArray(courses) ? courses : [])).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {selectedCourse ? (
                <>
                    {isError ? (
                        <div className="p-8 text-red-500 bg-red-50 rounded-lg">Failed to load course materials.</div>
                    ) : isLoading ? (
                        <div className="p-8 text-slate-500 animate-pulse bg-slate-50 rounded-lg">Fetching materials from secure vault...</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Notes Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Course Notes & Files
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {notes.length === 0 ? (
                                        <div className="p-6 text-slate-500 text-sm italic">No files have been published yet.</div>
                                    ) : (
                                        notes.map((note: any) => {
                                            return (
                                                <Link
                                                    key={note.id}
                                                    to="/student/courses/$courseId"
                                                    params={{ courseId: selectedCourse }}
                                                    search={{ tab: 'notes' }}
                                                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                                                >
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{note.title}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Uploaded: {new Date(note.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">View in Syllabus →</span>
                                                        <DownloadButton objectName={note.file_url} />
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Assignments Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        Pending Assignments
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {assignments.filter((a: any) => a.submission_status !== 'submitted').length === 0 ? (
                                        <div className="p-6 text-slate-500 text-sm italic">No assignments are due right now.</div>
                                    ) : (
                                        assignments.filter((a: any) => a.submission_status !== 'submitted').map((assignment: any) => (
                                            <Link
                                                key={assignment.id}
                                                to="/student/courses/$courseId"
                                                params={{ courseId: selectedCourse }}
                                                search={{ tab: 'assignments' }}
                                                className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">{assignment.title}</p>
                                                        <p className="text-xs text-emerald-600 font-bold mt-1">
                                                            {assignment.submission_status === 'submitted' ? '✓ Submitted' : '○ Pending'} · {assignment.attempts_made || 0}/{assignment.max_attempts || 1} Attempts · {assignment.total_marks || 100} Marks
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 text-right">
                                                        <span className="text-xs font-mono text-red-500 border border-red-200 bg-red-50 px-2 py-1 rounded">
                                                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">Start Assignment →</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </>
            ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <span className="text-slate-500">Please select an enrolled course above to view materials.</span>
                </div>
            )}
        </div>
    );
};
