import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentSubmissionSchema, type AssignmentSubmissionData } from '../schemas';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { useCreateSubmissionMutation } from '../../submissions/hooks/useSubmissions';
import { materialsApi } from '../../materials/api';

export const AssignmentSubmissionPage: React.FC = () => {
    const { addToast } = useToastStore();
    const { data: courses } = useStudentCourses();

    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const { data: materials, isLoading: isMaterialsLoading } = useCourseMaterialsQuery(selectedCourse);

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
    } = useForm<AssignmentSubmissionData>({
        resolver: zodResolver(assignmentSubmissionSchema),
    });

    const selectedAssignmentId = watch('assignment_id');
    const selectedAssignment = assignments.find((a: any) => a.id.toString() === selectedAssignmentId);

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

        if (!selectedAssignment) return;

        // Check attempts left
        const attemptsMade = selectedAssignment.attempts_made || 0;
        const maxAttempts = selectedAssignment.max_attempts || 1;
        if (attemptsMade >= maxAttempts) {
            addToast('No attempts left for this assignment', 'error');
            return;
        }

        // Check deadline
        const dueDate = new Date(selectedAssignment.due_date);
        if (new Date() > dueDate) {
            addToast('Submission deadline has passed', 'error');
            return;
        }

        try {
            setIsUploading(true);

            // 1. Upload to MinIO
            const uploadRes = await materialsApi.uploadFile(selectedFile);

            // 2. Submit to backend
            await createSubmission.mutateAsync({
                assignment_id: Number(data.assignment_id),
                file_url: uploadRes.file_url,
                comments: data.comments,
            });

            addToast('Assignment submitted successfully!', 'success');
            reset({ assignment_id: '', comments: '' });
            setSelectedFile(null);
            setSelectedCourse('');

        } catch (error: any) {
            console.error('Submission error:', error);
            addToast(error.response?.data?.detail || 'Failed to submit assignment', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const isPastDue = selectedAssignment ? new Date() > new Date(selectedAssignment.due_date) : false;
    const noAttemptsLeft = selectedAssignment ? (selectedAssignment.attempts_made || 0) >= (selectedAssignment.max_attempts || 1) : false;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assignment Submission Portal</h1>
                    <p className="text-slate-500 mt-2">Manage your coursework, track attempts, and upload your final submissions.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Selection & Details Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">1</span>
                            Selection Context
                        </h2>

                        <div>
                            <label htmlFor="submission-course" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Course</label>
                            <select
                                id="submission-course"
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
                            <label htmlFor="submission-assignment" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Assignment</label>
                            <select
                                {...register('assignment_id')}
                                id="submission-assignment"
                                disabled={!selectedCourse || isMaterialsLoading}
                                className="w-full rounded-xl border-slate-200 shadow-sm focus:ring-indigo-500 py-3 px-4 bg-slate-50 text-slate-700 font-medium disabled:opacity-50"
                            >
                                <option value="">Select target assignment...</option>
                                {assignments.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.title}</option>
                                ))}
                            </select>
                            {errors.assignment_id && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.assignment_id.message}</p>}
                        </div>
                    </div>

                    {selectedAssignment && (
                        <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                            <h3 className="text-xl font-bold mb-6 relative z-10">{selectedAssignment.title}</h3>

                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-slate-400 text-sm">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedAssignment.submission_status === 'submitted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {selectedAssignment.submission_status || 'Pending'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-slate-400 text-sm">Attempts Left</span>
                                    <span className="font-mono text-lg font-bold">
                                        {(selectedAssignment.max_attempts || 1) - (selectedAssignment.attempts_made || 0)} / {selectedAssignment.max_attempts || 1}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-slate-400 text-sm">Due Date</span>
                                    <span className={`font-medium ${isPastDue ? 'text-rose-400' : 'text-slate-200'}`}>
                                        {new Date(selectedAssignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 text-sm block mb-2">Instructions</span>
                                    <p className="text-sm text-slate-300 leading-relaxed italic">
                                        {selectedAssignment.description || "No specific instructions provided for this assignment payload."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submission Form Area */}
                <div className="lg:col-span-7">
                    {!selectedAssignment ? (
                        <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm mb-4">📍</div>
                            <h3 className="text-lg font-bold text-slate-700">Ready to Submit?</h3>
                            <p className="text-slate-500 text-sm max-w-xs mt-2">Please select a course and assignment from the selection panel to begin your submission process.</p>
                        </div>
                    ) : noAttemptsLeft || isPastDue ? (
                        <div className="h-full bg-rose-50 border border-rose-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm mb-4 border border-rose-100">🚫</div>
                            <h3 className="text-xl font-bold text-rose-900">Submission Blocked</h3>
                            <p className="text-rose-700 text-sm max-w-sm mt-3">
                                {noAttemptsLeft
                                    ? "You have reached the maximum allowed attempts for this assignment. Please contact your instructor for a reset if necessary."
                                    : "The submission window for this assignment has closed as of the designated due date."}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="border-b border-slate-100 pb-6">
                                <h2 className="text-xl font-bold text-slate-800">Final Submission</h2>
                                <p className="text-sm text-slate-500 mt-1">Please ensure your work is final before clicking submit.</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <FormInput
                                    label="Submission Comments"
                                    type="text"
                                    placeholder="Optional: Provide extra context or notes regarding your work..."
                                    register={register('comments')}
                                    error={errors.comments?.message}
                                />

                                <div>
                                    <label htmlFor="submission-file" className="block text-sm font-bold text-slate-700 mb-2">Attached File Payload</label>
                                    <div className={`relative group border-2 border-dashed rounded-2xl p-8 transition-all ${selectedFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                                        }`}>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            id="submission-file"
                                        />
                                        <div className="flex flex-col items-center justify-center py-4">
                                            {selectedFile ? (
                                                <>
                                                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-4">📎</div>
                                                    <p className="text-emerald-800 font-bold">{selectedFile.name}</p>
                                                    <p className="text-emerald-600 text-xs mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready for upload</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFile(null)}
                                                        className="mt-4 text-xs font-bold text-rose-500 hover:text-rose-600 underline"
                                                    >
                                                        Remove and Replace File
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-14 h-14 bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors">📄</div>
                                                    <p className="text-slate-700 font-bold">Upload Your Final Work</p>
                                                    <p className="text-slate-500 text-xs mt-1">Tap to browse or drag and drop your file here</p>
                                                    <p className="text-[10px] text-slate-400 mt-6 font-medium">MAX 10MB · PDF, ZIP, DOCX SUPPORTED</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col items-center">
                                    <Button
                                        type="submit"
                                        className="w-full py-4 rounded-xl text-lg font-bold shadow-indigo-100 shadow-xl"
                                        isLoading={isSubmitting || isUploading || createSubmission.isPending}
                                        disabled={isSubmitting || isUploading || createSubmission.isPending}
                                    >
                                        {(isSubmitting || isUploading || createSubmission.isPending) ? 'Processing Submission...' : 'Securely Submit Assignment'}
                                    </Button>
                                    <p className="text-[10px] text-slate-400 text-center mt-4 uppercase tracking-widest font-bold">
                                        Your IP and timestamp will be logged for academic integrity
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
