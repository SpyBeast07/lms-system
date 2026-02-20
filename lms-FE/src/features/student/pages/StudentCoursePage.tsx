import React, { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useCourseQuery } from '../../courses/hooks/useCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { usePresignedUrlMutation } from '../../files/hooks/useFiles';
import { useToastStore } from '../../../app/store/toastStore';

export const StudentCoursePage: React.FC = () => {
    const { courseId } = useParams({ strict: false }) as { courseId: string };
    const { addToast } = useToastStore();

    const [activeTab, setActiveTab] = useState<'notes' | 'assignments'>('notes');

    const { data: course, isLoading: isLoadingCourse, isError: isCourseError } = useCourseQuery(courseId);
    const { data: materials, isLoading: isLoadingMaterials, isError: isMaterialsError } = useCourseMaterialsQuery(courseId);

    const presignedMutation = usePresignedUrlMutation();

    if (isLoadingCourse) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading classroom...</div>;
    if (isCourseError || !course) return <div className="p-8 text-red-500 font-medium">Failed to establish classroom context. Are you sure you're enrolled?</div>;

    const notes = materials?.filter((m: any) => m.file_url) || [];
    const assignments = materials?.filter((m: any) => !m.file_url) || [];

    const handleDownload = (fileUrl: string) => {
        // fileUrl is like http://localhost:9000/lms-files/uuid.pdf or http://localhost:9000/lms-files/notes/uuid.pdf
        const parts = fileUrl.split('/');
        // Extract everything after the bucket name (bucket is always at index 3 in an S3 Path Style URL)
        const objectName = parts.slice(4).join('/');

        if (!objectName) {
            addToast('Invalid file link', 'error');
            return;
        }
        presignedMutation.mutate({ object_name: objectName }, {
            onSuccess: (data) => window.open(data.url, '_blank'),
            onError: () => addToast('Failed to secure download link from MinIO storage', 'error')
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-60 pointer-events-none"></div>
                <div className="relative z-10">
                    <Link to="/student/courses" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4 inline-block">
                        ← Back to Curriculum
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{course.name}</h1>
                    <p className="max-w-3xl text-slate-600 mt-2">{course.description || "Course syllabus loading..."}</p>
                </div>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex gap-6">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'notes'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        📚 Course Notes ({notes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'assignments'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        📝 Assignments ({assignments.length})
                    </button>
                </nav>
            </div>

            <div className="pt-4">
                {isLoadingMaterials ? (
                    <div className="p-8 text-slate-500 font-medium animate-pulse bg-white border border-slate-200 rounded-xl">Synchronizing materials...</div>
                ) : isMaterialsError ? (
                    <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">Failed to lookup material indexing.</div>
                ) : (
                    <>
                        {activeTab === 'notes' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {notes.length === 0 ? (
                                    <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 bg-white">
                                        No notes logically assigned to this module yet.
                                    </div>
                                ) : (
                                    notes.map((note: any) => (
                                        <div key={note.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">{note.title}</h3>
                                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-2">Posted: {new Date(note.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(note.file_url)}
                                                disabled={presignedMutation.isPending}
                                                className="mt-6 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Download Note Packet
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'assignments' && (
                            <div className="space-y-4">
                                {assignments.length === 0 ? (
                                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 bg-white">
                                        You have no outstanding assignments for this matrix! 🎉
                                    </div>
                                ) : (
                                    assignments.map((assignment: any) => (
                                        <div key={assignment.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    {assignment.title}
                                                </h3>
                                                <p className="text-sm font-medium text-slate-500 mt-1">Due Date: <span className="text-rose-600 font-semibold">{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}</span></p>
                                                <p className="text-xs text-slate-400 mt-2">Total Marks Potential: {assignment.total_marks || 100}</p>
                                            </div>
                                            <Link
                                                to="/student/courses/$courseId/assignments/$assignmentId"
                                                params={{ courseId, assignmentId: assignment.id.toString() }}
                                                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-sm transition-colors border border-slate-200 shadow-sm"
                                            >
                                                View Assignment Details →
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
