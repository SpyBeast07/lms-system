import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentSubmissionSchema } from '../schemas';
import { useCourseQuery } from '../../courses/hooks/useCourses';
import { useCourseMaterialsQuery, useAssignmentDetailsQuery } from '../../materials/hooks/useMaterials';
import { useCreateSubmissionMutation, useAssignmentAttemptsQuery } from '../../submissions/hooks/useSubmissions';
import { AssessmentAnswersModal } from '../../teacher/components/AssessmentAnswersModal';
import { useToastStore } from '../../../app/store/toastStore';
import { materialsApi } from '../../materials/api';
import { DownloadButton } from '../components/DownloadButton';
import { Button } from '../../../shared/components/Button';
import { FormInput } from '../../../shared/components/form/FormInput';
import { api } from '../../../shared/api/axios';

export const AssignmentDetailPage: React.FC = () => {
    const { courseId, assignmentId } = useParams({ strict: false }) as { courseId: string, assignmentId: string };
    const { addToast } = useToastStore();
    const navigate = useNavigate();

    const { data: course, isLoading: isLoadingCourse } = useCourseQuery(courseId);
    const { data: materials, isLoading: isLoadingMaterials } = useCourseMaterialsQuery(courseId);
    const { data: assignmentDetails, isLoading: isLoadingDetails } = useAssignmentDetailsQuery(assignmentId);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
    const { data: attempts } = useAssignmentAttemptsQuery(Number(assignmentId));
    const queryClient = useQueryClient();
    const createSubmission = useCreateSubmissionMutation();

    const assignment = materials?.find((m: any) => m.id.toString() === assignmentId);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<any>({
        resolver: zodResolver(assignmentSubmissionSchema),
        defaultValues: {
            assignment_id: assignmentId,
            answers: []
        }
    });

    const currentAssignmentType = (assignmentDetails?.assignment_type || assignment?.assignment_type || 'FILE_UPLOAD').toString().toUpperCase();

    // Initialize answers when assignment changes
    useEffect(() => {
        if (assignmentDetails && assignmentDetails.questions) {
            const initialAnswers = assignmentDetails.questions.map((q: any) => ({
                question_id: q.id,
                selected_option_ids: [],
                answer_text: '',
            }));
            setValue('answers', initialAnswers);
        }
    }, [assignmentDetails, setValue]);

    if (isLoadingCourse || isLoadingMaterials || isLoadingDetails) {
        return (
            <div className="max-w-4xl mx-auto p-12 space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                <div className="h-64 bg-slate-100 rounded-2xl"></div>
            </div>
        );
    }

    if (!course || (!assignment && !assignmentDetails)) {
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

    const isPastDue = assignment?.due_date ? new Date() > new Date(assignment.due_date) : false;
    const noAttemptsLeft = assignment ? (assignment.attempts_made || 0) >= (assignment.max_attempts || 1) : false;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: any) => {
        if (noAttemptsLeft || isPastDue) {
            addToast('Submission is currently blocked for this assignment', 'error');
            return;
        }

        try {
            setIsUploading(true);

            if (currentAssignmentType === 'FILE_UPLOAD') {
                if (!selectedFile) {
                    addToast('Please attach your assignment file', 'error');
                    return;
                }
                const uploadRes = await materialsApi.uploadFile(selectedFile);
                await createSubmission.mutateAsync({
                    assignment_id: Number(assignmentId),
                    file_url: uploadRes.file_url,
                    object_name: uploadRes.object_name,
                    comments: data.comments,
                });
                addToast('Assignment submitted successfully!', 'success');
            } else {
                // MCQ or TEXT submission
                const response = await api.post('/assignments/submit', {
                    assignment_id: Number(assignmentId),
                    answers: data.answers,
                });

                setResultData(response.data);
                setShowResult(true);
                addToast('Assessment submitted and evaluated!', 'success');

                // Manually invalidate materials to update submission count/status
                queryClient.invalidateQueries({ queryKey: [{ entity: 'materials' }] });
            }

            setSelectedFile(null);

            if (currentAssignmentType === 'FILE_UPLOAD') {
                reset({
                    assignment_id: assignmentId,
                    comments: '',
                    answers: []
                });
            }

            // check if no attempts left to redirect
            const attemptsMade = (assignment?.attempts_made || 0) + 1;
            const maxAttempts = assignment?.max_attempts || assignmentDetails?.max_attempts || 1;
            if (attemptsMade >= maxAttempts) {
                setTimeout(() => {
                    navigate({ to: '/student/courses/$courseId', params: { courseId } });
                }, 1500); // Small delay to let user see toast
            }

        } catch (error: any) {
            console.error('Submission error:', error);
            addToast(error.response?.data?.detail || 'Failed to submit assignment', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const onInvalid = (errors: any) => {
        console.error('Form validation errors:', errors);
        const firstErrorPath = Object.keys(errors)[0];
        const errorDetail = firstErrorPath ? errors[firstErrorPath]?.message : 'Check form fields';
        // Try to get array errors if it's 'answers'
        let detailMsg = errorDetail;
        if (firstErrorPath === 'answers' && Array.isArray(errors.answers)) {
            const firstAnsErr = errors.answers.find((e: any) => e);
            if (firstAnsErr) {
                detailMsg = (Object.values(firstAnsErr)[0] as any)?.message || 'Invalid assessment answers';
            }
        }
        addToast(`Validation failed: ${detailMsg || 'Invalid field format'}`, 'error');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/student/courses/$courseId" params={{ courseId }} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2 mb-2">
                        ← Back to {course.name}
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{assignment?.title || assignmentDetails?.title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${assignment?.submission_status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {assignment?.submission_status === 'submitted' ? '✓ Submitted' : '○ Pending'}
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
                                            {assignment?.due_date || assignmentDetails?.due_date ? new Date(assignment?.due_date || assignmentDetails.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Max Marks</p>
                                        <p className="text-sm font-bold text-emerald-400">{assignment?.total_marks || assignmentDetails?.total_marks || 100}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Submission Progress</h3>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Attempts Used</p>
                                        <p className="text-xl font-black">{assignment?.attempts_made || 0} <span className="text-slate-500 text-sm font-bold">/ {assignment?.max_attempts || assignmentDetails?.max_attempts || 1}</span></p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">⏳</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Instructions</h3>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <p className="text-slate-300 leading-relaxed italic">
                                        {assignment?.description || assignmentDetails?.description || "The instructor has not provided specific text-based instructions for this assignment. Please refer to course modules for context."}
                                    </p>
                                </div>
                            </div>

                            {(assignment?.reference_materials?.length > 0 || assignmentDetails?.reference_materials?.length > 0) && (
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Reference Materials</h3>
                                    <div className="space-y-2">
                                        {(assignmentDetails?.reference_materials || assignment?.reference_materials || []).map((ref: any, idx: number) => (
                                            ref.type === 'link' ? (
                                                <a
                                                    key={idx}
                                                    href={ref.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-3 rounded-lg w-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-colors"
                                                >
                                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                    <span className="truncate">{ref.name}</span>
                                                </a>
                                            ) : (
                                                <DownloadButton
                                                    key={idx}
                                                    fileUrl={ref.url}
                                                    label={ref.name}
                                                    variant="indigo"
                                                    className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/30 text-indigo-300"
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            System Parameters
                        </h4>
                        <ul className="text-xs text-slate-500 space-y-3">
                            <li className="flex justify-between"><span>Format</span> <span className="font-bold text-slate-700 uppercase">{currentAssignmentType}</span></li>
                            <li className="flex justify-between"><span>Auto-Grading</span> <span className="font-bold text-slate-700">{currentAssignmentType === 'MCQ' ? 'Supported' : 'Not Supported'}</span></li>
                            <li className="flex justify-between"><span>Integrity Check</span> <span className="font-bold text-slate-700">Enabled</span></li>
                        </ul>
                    </div>
                </div>

                {/* Submission Form Pane */}
                <div className="lg:col-span-7">
                    {noAttemptsLeft || isPastDue ? (
                        <div className="space-y-6">
                            <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-sm mb-6 border border-rose-100 transform -rotate-6">🧩</div>
                                <h3 className="text-2xl font-black text-rose-900">Submission Window Closed</h3>
                                <p className="text-rose-700 text-sm max-w-sm mt-4 leading-relaxed font-medium">
                                    {noAttemptsLeft
                                        ? "You have exhausted all available attempts for this assignment. Review your previous attempts below."
                                        : "The designated deadline for this assignment has elapsed."}
                                </p>
                            </div>

                            {attempts && attempts.length > 0 && (
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
                                    <h4 className="text-lg font-bold text-slate-800">Previous Attempts</h4>
                                    <div className="space-y-3">
                                        {attempts.map((attempt: any) => (
                                            <div key={attempt.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">Attempt #{attempt.attempt_number}</p>
                                                    <p className="text-xs text-slate-500">{new Date(attempt.submitted_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-indigo-600">{attempt.total_score} <span className="text-slate-400 text-xs">/ {attempt.total_marks || 100}</span></p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setSelectedAttempt(attempt);
                                                        }}
                                                        className="py-1 px-3 text-xs"
                                                    >
                                                        Review
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : showResult ? (
                        <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="text-center space-y-4">
                                <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-xl shadow-indigo-200 rotate-3">✨</div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Attempt Finalized</h2>
                                <p className="text-slate-500 font-medium">Your assessment has been auto-graded by the academic cloud.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pb-4">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Score</p>
                                    <p className="text-4xl font-black text-indigo-600">{resultData?.total_score || 0}<span className="text-slate-300 text-sm">/{assignment?.total_marks || assignmentDetails?.total_marks || 100}</span></p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Percentage</p>
                                    <p className="text-4xl font-black text-slate-800">{Math.round(((resultData?.total_score || 0) / (assignment?.total_marks || assignmentDetails?.total_marks || 100)) * 100)}%</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    to="/student/submissions"
                                    className="block w-full py-4 bg-slate-900 text-white rounded-2xl text-center font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                >
                                    View in Submission History
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSelectedAttempt(resultData)}
                                    className="w-full py-4 text-indigo-600 font-bold hover:bg-indigo-50 rounded-2xl transition-all border border-indigo-200"
                                >
                                    Review Submitted Answers
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID: {resultData?.id || 'Pending'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        {currentAssignmentType === 'FILE_UPLOAD' ? 'Final Upload' : 'Assessment Form'}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">Ready to submit? Follow the prompts below.</p>
                                </div>
                                <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">Secure Link</div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                                {currentAssignmentType === 'FILE_UPLOAD' ? (
                                    <div className="space-y-8">
                                        <FormInput
                                            label="Submission Comments"
                                            type="text"
                                            placeholder="Add any clarifying notes for your instructor..."
                                            register={register('comments')}
                                            error={errors.comments?.message as string}
                                        />

                                        <div>
                                            <label htmlFor="detail-file" className="block text-sm font-bold text-slate-700 mb-3">Supporting Document</label>
                                            <div className={`relative group border-3 border-dashed rounded-[1.5rem] p-12 transition-all duration-300 ${selectedFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20'
                                                }`}>
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    id="detail-file"
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
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {assignmentDetails?.questions?.map((q: any, idx: number) => (
                                            <div key={q.id} className="space-y-4 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h3 className="font-bold text-slate-800 flex gap-2">
                                                        <span className="text-indigo-600">Q{idx + 1}.</span>
                                                        {q.question_text}
                                                    </h3>
                                                    <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-400 uppercase tracking-tight whitespace-nowrap">
                                                        {q.marks} Marks
                                                    </span>
                                                </div>

                                                {q.question_type === 'MCQ' ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {q.options?.map((opt: any) => (
                                                            <label
                                                                key={opt.id}
                                                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${watch(`answers.${idx}.selected_option_ids`)?.includes(opt.id)
                                                                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                                                                    : 'border-white bg-white hover:border-slate-200'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    value={opt.id}
                                                                    checked={watch(`answers.${idx}.selected_option_ids`)?.includes(opt.id) || false}
                                                                    onChange={(e) => {
                                                                        const current = watch(`answers.${idx}.selected_option_ids`) || [];
                                                                        const next = e.target.checked
                                                                            ? [...current, opt.id]
                                                                            : current.filter((id: number) => id !== opt.id);
                                                                        setValue(`answers.${idx}.selected_option_ids`, next);
                                                                    }}
                                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                                                />
                                                                <span className="text-sm font-medium text-slate-700">{opt.option_text}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        {...register(`answers.${idx}.answer_text` as any)}
                                                        rows={4}
                                                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-4 text-sm"
                                                        placeholder="Type your answer here..."
                                                    />
                                                )}
                                            </div>
                                        ))}

                                        {(!assignmentDetails?.questions || assignmentDetails.questions.length === 0) && (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                                <p className="text-slate-500 font-medium">No questions found for this assessment.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

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
            <AssessmentAnswersModal
                attemptId={selectedAttempt?.id || null}
                studentName="Your"
                onClose={() => setSelectedAttempt(null)}
            />
        </div >
    );
};
