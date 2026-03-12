import React, { useState } from 'react';
import { useParams, Link, useSearch, useNavigate } from '@tanstack/react-router';
import { useCourseQuery } from '../../courses/hooks/useCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { usePresignedUrlMutation } from '../../files/hooks/useFiles';
import { useToastStore } from '../../../app/store/toastStore';
import { useExplainTopic, useSummarizeNotes, useGeneratePractice } from '../../ai/hooks';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/Button';
import ReactMarkdown from 'react-markdown';

export const StudentCoursePage: React.FC = () => {
    const { courseId } = useParams({ strict: false }) as { courseId: string };
    const { tab } = useSearch({ strict: false }) as { tab: 'notes' | 'assignments' | 'practice' };
    const navigate = useNavigate({ from: '/student/courses/$courseId' });
    const { addToast } = useToastStore();

    const activeTab = tab || 'notes';
    const setActiveTab = (newTab: 'notes' | 'assignments' | 'practice') => {
        navigate({
            search: (prev: any) => ({ ...prev, tab: newTab }),
            replace: true
        });
    };

    // AI State
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiTitle, setAiTitle] = useState('');
    const [aiResult, setAiResult] = useState('');

    // AI Hooks
    const explainMutation = useExplainTopic();
    const summarizeMutation = useSummarizeNotes();
    const practiceMutation = useGeneratePractice();
    const isAiLoading = explainMutation.isPending || summarizeMutation.isPending || practiceMutation.isPending;

    const { data: course, isLoading: isLoadingCourse, isError: isCourseError } = useCourseQuery(courseId);
    const { data: materials, isLoading: isLoadingMaterials, isError: isMaterialsError } = useCourseMaterialsQuery(courseId);

    const presignedMutation = usePresignedUrlMutation();

    if (isLoadingCourse) return <div className="p-8 text-slate-500 font-medium animate-pulse">Loading classroom...</div>;
    if (isCourseError || !course) return <div className="p-8 text-red-500 font-medium">Failed to establish classroom context. Are you sure you're enrolled?</div>;

    const notes = materials?.filter((m: any) => m.type === 'notes') || [];
    const assignments = materials?.filter((m: any) => m.type === 'assignment') || [];

    const handleDownload = (fileUrl: string) => {
        const parts = fileUrl.split('/');
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

    const handleAiExplain = (topic: string) => {
        setAiTitle(`AI Explanation: ${topic}`);
        setAiResult('');
        setAiModalOpen(true);
        explainMutation.mutate(topic, {
            onSuccess: (data) => setAiResult(data)
        });
    };

    const handleAiSummarize = (topic: string) => {
        setAiTitle(`AI Summary: ${topic}`);
        setAiResult('');
        setAiModalOpen(true);
        summarizeMutation.mutate(topic, {
            onSuccess: (data) => setAiResult(data)
        });
    };

    const handleAiPractice = () => {
        const topic = course.description || course.name;
        setAiTitle(`Practice Questions for ${course.name}`);
        setAiResult('');
        setAiModalOpen(true);
        practiceMutation.mutate(topic, {
            onSuccess: (data) => setAiResult(data)
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
                    <button
                        onClick={() => setActiveTab('practice')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'practice'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        ✨ AI Practice Generator
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
                                            <div className="mt-6 flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleDownload(note.file_url)}
                                                    disabled={presignedMutation.isPending}
                                                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                                                >
                                                    Download Note Packet
                                                </button>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleAiSummarize(note.title)}
                                                        className="flex justify-center items-center gap-1.5 py-2 px-4 border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <span>✨</span> Summarize
                                                    </button>
                                                    <button
                                                        onClick={() => handleAiExplain(note.title)}
                                                        className="flex justify-center items-center gap-1.5 py-2 px-4 border border-emerald-200 rounded-md text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <span>✨</span> Explain
                                                    </button>
                                                </div>
                                            </div>
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
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-slate-800">
                                                        {assignment.title}
                                                    </h3>
                                                    {assignment.submission_status === 'submitted' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            ✓ Submitted ({assignment.attempts_made || 0}/{assignment.max_attempts || 1})
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                            ○ Pending ({assignment.attempts_made || 0}/{assignment.max_attempts || 1})
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 mt-1">Due Date: <span className="text-rose-600 font-semibold">{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}</span></p>
                                                <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">{assignment.description || "No specific instructions provided."}</p>
                                                <p className="text-xs text-slate-300 mt-1 uppercase tracking-wider font-bold">Total Marks Potential: {assignment.total_marks || 100}</p>
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

                        {activeTab === 'practice' && (
                            <div className="bg-emerald-50 border-2 border-emerald-200 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-white shrink-0 rounded-full flex items-center justify-center text-3xl shadow-sm mb-4">
                                    🎓
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Generate Practice Material</h3>
                                <p className="text-slate-600 mt-2 max-w-md mx-auto">
                                    Use our AI tutor to create comprehensive practice questions and scenarios based on the course syllabus.
                                </p>
                                <Button
                                    onClick={handleAiPractice}
                                    className="mt-6 shadow-sm border border-emerald-300"
                                    style={{ backgroundColor: '#10b981', color: 'white' }}
                                >
                                    ✨ Let's Practice!
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Modal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                title={aiTitle}
            >
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {isAiLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Your AI Tutor is typing...</p>
                        </div>
                    ) : aiResult ? (
                        <div className="prose prose-sm prose-indigo max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <ReactMarkdown>{aiResult}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-8">Something went wrong fetching the AI response.</p>
                    )}
                </div>
                <div className="pt-4 mt-2 flex justify-end">
                    <Button onClick={() => setAiModalOpen(false)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};
