import React, { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentSubmissionSchema, type AssignmentSubmissionData } from '../schemas';
import { useCourseQuery } from '../../courses/hooks/useCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { useCreateSubmissionMutation } from '../../submissions/hooks/useSubmissions';
import { useToastStore } from '../../../app/store/toastStore';
import { materialsApi } from '../../materials/api';
import { Button } from '../../../shared/components/Button';
import { FormInput } from '../../../shared/components/form/FormInput';

export const AssignmentDetailPage: React.FC = () => {
    const { courseId, assignmentId } = useParams({ strict: false }) as { courseId: string, assignmentId: string };
    const { addToast } = useToastStore();

    const { data: course, isLoading: isLoadingCourse } = useCourseQuery(courseId);
    const { data: materials, isLoading: isLoadingMaterials } = useCourseMaterialsQuery(courseId);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const createSubmission = useCreateSubmissionMutation();

    const assignment = materials?.find((m: any) => m.id.toString() === assignmentId);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AssignmentSubmissionData>({
        resolver: zodResolver(assignmentSubmissionSchema),
        defaultValues: {
            assignment_id: assignmentId
        }
    });

    if (isLoadingCourse || isLoadingMaterials) {
        return (
            <div className="max-w-4xl mx-auto p-12 space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                <div className="h-64 bg-slate-100 rounded-2xl"></div>
            </div>
        );
    }

    if (!course || !assignment) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🧩</div>
                <h2 className="text-2xl font-bold text-slate-800">Assignment Not Found</h2>
                <p className="text-slate-500 mt-2">The record requested could not be located in the current course context.</p>
                <Link to="/student/courses/$courseId" params={{ courseId }} className="mt-8 inline-block text-indigo-600 font-bold hover:underline">
                    Return to Course Overview
                </Link>
            </div>
        );
    }

    const isPastDue = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;
    const noAttemptsLeft = (assignment.attempts_made || 0) >= (assignment.max_attempts || 1);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: AssignmentSubmissionData) => {
        if (!selectedFile) {
            addToast('Please attach your assignment file', 'error');
            return;
        }

        if (noAttemptsLeft || isPastDue) {
            addToast('Submission is currently blocked for this assignment', 'error');
            return;
        }

        try {
            setIsUploading(true);
            const uploadRes = await materialsApi.uploadFile(selectedFile);

            await createSubmission.mutateAsync({
                assignment_id: Number(assignmentId),
                file_url: uploadRes.file_url,
                comments: data.comments,
            });

            addToast('Assignment submitted successfully!', 'success');
            setSelectedFile(null);
            reset({ assignment_id: assignmentId, comments: '' });

        } catch (error: any) {
            console.error('Submission error:', error);
            addToast(error.response?.data?.detail || 'Failed to submit assignment', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/student/courses/$courseId" params={{ courseId }} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2 mb-2">
                        ← Back to {course.name}
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{assignment.title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${assignment.submission_status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {assignment.submission_status === 'submitted' ? '✓ Submitted' : '○ Pending'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Information Pane */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-indigo-500/30 transition-colors"></div>

                        <div className="relative z-10 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Assignment Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Due Date</p>
                                        <p className={`text-sm font-bold ${isPastDue ? 'text-rose-400' : 'text-slate-100'}`}>
                                            {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Max Marks</p>
                                        <p className="text-sm font-bold text-emerald-400">{assignment.total_marks || 100}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Submission Progress</h3>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Attempts Used</p>
                                        <p className="text-xl font-black">{assignment.attempts_made || 0} <span className="text-slate-500 text-sm font-bold">/ {assignment.max_attempts || 1}</span></p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">⏳</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Instructions</h3>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <p className="text-slate-300 leading-relaxed italic">
                                        {assignment.description || "The instructor has not provided specific text-based instructions for this assignment. Please refer to course modules for context."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            System Parameters
                        </h4>
                        <ul className="text-xs text-slate-500 space-y-3">
                            <li className="flex justify-between"><span>Format</span> <span className="font-bold text-slate-700 uppercase">{assignment.assignment_type || 'Digital'}</span></li>
                            <li className="flex justify-between"><span>Auto-Grading</span> <span className="font-bold text-slate-700">Supported</span></li>
                            <li className="flex justify-between"><span>Integrity Check</span> <span className="font-bold text-slate-700">Enabled</span></li>
                        </ul>
                    </div>
                </div>

                {/* Submission Form Pane */}
                <div className="lg:col-span-7">
                    {noAttemptsLeft || isPastDue ? (
                        <div className="h-full bg-rose-50 border border-rose-100 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-sm mb-6 border border-rose-100 transform -rotate-6">�</div>
                            <h3 className="text-2xl font-black text-rose-900">Submission Window Closed</h3>
                            <p className="text-rose-700 text-sm max-w-sm mt-4 leading-relaxed font-medium">
                                {noAttemptsLeft
                                    ? "You have exhausted all available attempts for this assignment. Please review your previous submissions or contact your instructor for an extension."
                                    : "The designated deadline for this assignment has elapsed. Late submissions are not being accepted at this stage."}
                            </p>
                            <Link to="/student/courses/$courseId" params={{ courseId }} className="mt-8 text-rose-900 font-bold hover:underline bg-rose-200/50 px-6 py-2 rounded-full transition-colors">
                                Return to Dashboard
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Final Upload</h2>
                                    <p className="text-sm text-slate-500 mt-1">Ready to submit? Follow the prompts below.</p>
                                </div>
                                <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">Secure Link</div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                <FormInput
                                    label="Submission Comments"
                                    type="text"
                                    placeholder="Add any clarifying notes for your instructor..."
                                    register={register('comments')}
                                    error={errors.comments?.message}
                                />

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Supporting Document</label>
                                    <div className={`relative group border-3 border-dashed rounded-[1.5rem] p-12 transition-all duration-300 ${selectedFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20'
                                        }`}>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center text-center">
                                            {selectedFile ? (
                                                <>
                                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm ring-4 ring-emerald-50">📄</div>
                                                    <p className="text-emerald-900 font-black text-lg">{selectedFile.name}</p>
                                                    <p className="text-emerald-600 text-xs font-bold mt-2 uppercase">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Validated</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFile(null)}
                                                        className="mt-6 text-xs font-black text-rose-500 hover:text-rose-600 underline"
                                                    >
                                                        Discard and Re-upload
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-all duration-500 shadow-inner group-hover:scale-110">☁️</div>
                                                    <p className="text-slate-800 font-black text-lg tracking-tight">Drop your masterpiece here</p>
                                                    <p className="text-slate-500 text-sm mt-2 max-w-[200px] leading-tight">Click to browse or drag your final submission logically</p>
                                                    <div className="mt-8 flex gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">PDF</span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">ZIP</span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">DOCX</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <Button
                                        type="submit"
                                        className="w-full py-5 rounded-2xl text-xl font-black shadow-2xl shadow-indigo-200 transition-transform active:scale-[0.98]"
                                        isLoading={isSubmitting || isUploading || createSubmission.isPending}
                                        disabled={isSubmitting || isUploading || createSubmission.isPending}
                                    >
                                        {(isSubmitting || isUploading || createSubmission.isPending) ? 'Processing Submission...' : 'Transmit Submission Now'}
                                    </Button>
                                    <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                        Encrypted Transmittal to Academic Cloud
                                    </p>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
