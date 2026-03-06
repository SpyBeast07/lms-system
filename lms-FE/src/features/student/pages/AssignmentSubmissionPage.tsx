import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentSubmissionSchema } from '../schemas';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useCourseMaterialsQuery, useAssignmentDetailsQuery } from '../../materials/hooks/useMaterials';
import { useCreateSubmissionMutation } from '../../submissions/hooks/useSubmissions';
import { DownloadButton } from '../components/DownloadButton';
import { materialsApi } from '../../materials/api';
import { api } from '../../../shared/api/axios';

export const AssignmentSubmissionPage: React.FC = () => {
    const { addToast } = useToastStore();
    const { data: courses } = useStudentCourses();
    const navigate = useNavigate();

    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const { data: materials, isLoading: isMaterialsLoading } = useCourseMaterialsQuery(selectedCourse);

    const queryClient = useQueryClient();
    const assignments = materials?.filter((m: any) => m.type === 'assignment') || [];
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const createSubmission = useCreateSubmissionMutation();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<any>({
        resolver: zodResolver(assignmentSubmissionSchema),
    });

    const selectedAssignmentId = watch('assignment_id');
    const { data: assignmentDetails, isLoading: isDetailsLoading } = useAssignmentDetailsQuery(selectedAssignmentId);

    // Find the summarized version from materials list to check status/attempts
    const assignmentSummary = assignments.find((a: any) => a.id.toString() === selectedAssignmentId);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: any) => {
        if (!assignmentDetails) return;

        // Check attempts left
        const attemptsMade = assignmentSummary?.attempts_made || 0;
        const maxAttempts = assignmentSummary?.max_attempts || 1;
        if (attemptsMade >= maxAttempts) {
            addToast('No attempts left for this assignment', 'error');
            return;
        }

        // Check deadline
        const dueDate = new Date(assignmentSummary?.due_date || assignmentDetails.due_date);
        if (new Date() > dueDate) {
            addToast('Submission deadline has passed', 'error');
            return;
        }

        try {
            setIsUploading(true);

            if (assignmentDetails.assignment_type === 'FILE_UPLOAD') {
                if (!selectedFile) {
                    addToast('Please attach your assignment file', 'error');
                    return;
                }
                const uploadRes = await materialsApi.uploadFile(selectedFile);

                // 2. Submit to backend
                await createSubmission.mutateAsync({
                    assignment_id: Number(data.assignment_id),
                    file_url: uploadRes.file_url,
                    object_name: uploadRes.object_name,
                    comments: data.comments,
                });
            } else {
                // MCQ or TEXT submission
                // We use the new attempt endpoint
                await api.post('/assignments/submit', {
                    assignment_id: Number(data.assignment_id),
                    answers: data.answers,
                });

                // Manually invalidate materials to update submission count/status
                queryClient.invalidateQueries({ queryKey: [{ entity: 'materials' }] });
            }

            addToast('Assignment submitted successfully!', 'success');

            // Clear only the answers and comments, keep the assignment selected
            reset({
                assignment_id: data.assignment_id,
                comments: '',
                answers: assignmentDetails.questions.map((q: any) => ({
                    question_id: q.id,
                    selected_option_id: undefined,
                    answer_text: '',
                }))
            });
            setSelectedFile(null);

            // check if no attempts left to redirect
            const finalAttemptsMade = (assignmentSummary?.attempts_made || 0) + 1;
            const finalMaxAttempts = assignmentSummary?.max_attempts || assignmentDetails?.max_attempts || 1;
            if (finalAttemptsMade >= finalMaxAttempts) {
                setTimeout(() => {
                    navigate({ to: '/student/courses' });
                }, 1500);
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
        let detailMsg = errorDetail;
        if (firstErrorPath === 'answers' && Array.isArray(errors.answers)) {
            const firstAnsErr = errors.answers.find((e: any) => e);
            if (firstAnsErr) {
                detailMsg = (Object.values(firstAnsErr)[0] as any)?.message || 'Invalid assessment answers';
            }
        }
        addToast(`Validation failed: ${detailMsg || 'Invalid field format'}`, 'error');
    };

    const isPastDue = assignmentSummary ? new Date() > new Date(assignmentSummary.due_date) : false;
    const noAttemptsLeft = assignmentSummary ? (assignmentSummary.attempts_made || 0) >= (assignmentSummary.max_attempts || 1) : false;

    // Determine type from summary first, then details
    const currentAssignmentType = (assignmentDetails?.assignment_type || assignmentSummary?.assignment_type || 'FILE_UPLOAD').toString().toUpperCase();

    // Initialize answers when assignment changes
    useEffect(() => {
        if (assignmentDetails && assignmentDetails.questions) {
            const initialAnswers = assignmentDetails.questions.map((q: any) => ({
                question_id: q.id,
                selected_option_id: undefined,
                answer_text: '',
            }));
            setValue('answers', initialAnswers);
        }
    }, [assignmentDetails, setValue]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assignment Portal</h1>
                    <p className="text-slate-500 mt-2">Manage your coursework and complete assessments.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Selection & Details Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            Selection Context
                        </h2>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Course</label>
                            <select
                                value={selectedCourse}
                                onChange={(e) => {
                                    setSelectedCourse(e.target.value);
                                    setValue('assignment_id', '');
                                }}
                                className="w-full rounded-xl border-slate-200 shadow-sm focus:ring-indigo-500 py-3 px-4 bg-slate-50 text-slate-700 font-medium"
                            >
                                <option value="">Choose a module...</option>
                                {((courses as any)?.items || []).map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Assignment</label>
                            <select
                                {...register('assignment_id')}
                                disabled={!selectedCourse || isMaterialsLoading}
                                className="w-full rounded-xl border-slate-200 shadow-sm focus:ring-indigo-500 py-3 px-4 bg-slate-50 text-slate-700 font-medium disabled:opacity-50"
                            >
                                <option value="">Select target assignment...</option>
                                {assignments.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.title}</option>
                                ))}
                            </select>
                            {errors.assignment_id && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.assignment_id.message as string}</p>}
                        </div>
                    </div>

                    {assignmentSummary && (
                        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                            <h3 className="text-xl font-bold mb-4">{assignmentSummary.title}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-slate-400">Type</span>
                                    <span className="font-medium text-indigo-400">{assignmentSummary.assignment_type}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-slate-400">Attempts</span>
                                    <span>{(assignmentSummary.max_attempts || 1) - (assignmentSummary.attempts_made || 0)} left</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Due</span>
                                    <span className={isPastDue ? 'text-rose-400' : ''}>
                                        {new Date(assignmentSummary.due_date).toLocaleDateString()}
                                    </span>
                                </div>
                                {(assignmentSummary?.reference_materials?.length > 0 || assignmentDetails?.reference_materials?.length > 0) && (
                                    <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reference Materials</p>
                                        <div className="space-y-2">
                                            {(assignmentDetails?.reference_materials || assignmentSummary?.reference_materials || []).map((ref: any, idx: number) => (
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
                    )}

                    {assignmentSummary && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
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
                    )}
                </div>

                {/* Submission Form Area */}
                <div className="lg:col-span-8">
                    {!selectedAssignmentId ? (
                        <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                            <h3 className="text-lg font-bold text-slate-700">Select an Assignment</h3>
                            <p className="text-slate-500 text-sm mt-2">Choose a course and assignment from the sidebar to begin.</p>
                        </div>
                    ) : (isDetailsLoading || !assignmentDetails) ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : noAttemptsLeft || isPastDue ? (
                        <div className="h-full bg-rose-50 border border-rose-100 rounded-2xl p-12 text-center">
                            <h3 className="text-xl font-bold text-rose-900">Submission Blocked</h3>
                            <p className="text-rose-700 text-sm mt-3">
                                {noAttemptsLeft ? "Maximum attempts reached." : "The deadline has passed."}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-800">
                                    {currentAssignmentType === 'FILE_UPLOAD' ? 'File Submission' : 'Assessment Form'}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">{assignmentDetails.description || 'Follow the instructions below.'}</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                                {currentAssignmentType === 'FILE_UPLOAD' ? (
                                    <div className="space-y-6">
                                        <FormInput
                                            label="Comments (Optional)"
                                            register={register('comments')}
                                            placeholder="Notes for your teacher..."
                                        />
                                        <div className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${selectedFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                                            <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            {selectedFile ? (
                                                <div>
                                                    <p className="text-emerald-800 font-bold">{selectedFile.name}</p>
                                                    <button type="button" onClick={() => setSelectedFile(null)} className="text-xs text-rose-500 font-bold underline mt-2">Replace File</button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-slate-700 font-bold">Drag & drop or click to upload</p>
                                                    <p className="text-slate-400 text-xs mt-1">PDF, ZIP, DOCX (Max 10MB)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {assignmentDetails.questions?.map((q: any, idx: number) => (
                                            <div key={q.id} className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
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
                                                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${watch(`answers.${idx}.selected_option_id`) === opt.id
                                                                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                                                                    : 'border-white bg-white hover:border-slate-200'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    value={opt.id}
                                                                    {...register(`answers.${idx}.selected_option_id` as any)}
                                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
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
                                        {(!assignmentDetails.questions || assignmentDetails.questions.length === 0) && (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                                <p className="text-slate-500 font-medium">No questions found for this assessment.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        className="w-full py-4 rounded-xl text-lg font-bold shadow-indigo-100 shadow-xl"
                                        isLoading={isSubmitting || isUploading || createSubmission.isPending}
                                        disabled={isSubmitting || isUploading || createSubmission.isPending}
                                    >
                                        Submit Assessment
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
