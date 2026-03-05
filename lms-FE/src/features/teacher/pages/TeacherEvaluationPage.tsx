import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTeacherCourses } from '../hooks/useTeacherCourses';
import { useCourseMaterialsQuery, useAssignmentDetailsQuery } from '../../materials/hooks/useMaterials';
import { useAssignmentSubmissionsQuery, useGradeSubmissionMutation } from '../../submissions/hooks/useSubmissions';
import { Table } from '../../../shared/components/ui/Table';
import { Modal } from '../../../shared/components/ui/Modal';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { type Submission } from '../../submissions/schemas';
import { SkeletonTable } from '../../../shared/components/skeleton/Skeletons';
import { DownloadButton } from '../../student/components/DownloadButton';
import { AssessmentAnswersModal } from '../components/AssessmentAnswersModal';

export const TeacherEvaluationPage: React.FC = () => {
    const { addToast } = useToastStore();

    // Filtering state
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedAssignment, setSelectedAssignment] = useState<string>('');
    const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
    const [reviewingAttempt, setReviewingAttempt] = useState<{ id: number; name: string } | null>(null);

    // Queries
    const queryClient = useQueryClient();
    const { data: courses } = useTeacherCourses();
    const { data: materials, isLoading: isMaterialsLoading } = useCourseMaterialsQuery(selectedCourse);
    const { data: submissions, isLoading: isSubmissionsLoading } = useAssignmentSubmissionsQuery(
        selectedAssignment ? parseInt(selectedAssignment, 10) : undefined
    );
    const { data: selectedAssignmentData } = useAssignmentDetailsQuery(selectedAssignment);
    const gradeMutation = useGradeSubmissionMutation();

    // Form with dynamic validation
    const maxGrade = selectedAssignmentData ? (selectedAssignmentData.total_marks || 100) : 100;
    const dynamicGradeSchema = z.object({
        grade: z.number()
            .min(0, 'Grade cannot be negative')
            .max(maxGrade, `Grade cannot exceed max marks (${maxGrade})`),
        feedback: z.string().optional().nullable(),
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
        resolver: zodResolver(dynamicGradeSchema)
    });

    const assignments = materials?.filter((m: any) => !m.file_url) || [];

    const handleGradeClick = (submission: Submission) => {
        setGradingSubmission(submission);
        reset({
            grade: submission.grade ?? submission.total_score ?? undefined,
            feedback: submission.feedback || submission.teacher_feedback || ''
        });
    };

    const onSubmitGrade = async (formData: any) => {
        if (!gradingSubmission) return;

        try {
            await gradeMutation.mutateAsync({
                submissionId: gradingSubmission.id,
                data: {
                    grade: formData.grade,
                    feedback: formData.feedback,
                    submission_type: gradingSubmission.submission_type
                }
            });
            addToast('Grade successfully applied!', 'success');
            setGradingSubmission(null);

            // Revalidate submissions query to instantly reflect status change
            queryClient.invalidateQueries({ queryKey: ['submissions'] });
            reset();
        } catch {
            addToast('Failed to apply grade', 'error');
        }
    };

    const columns = [
        {
            header: 'Student',
            cell: ({ row }: { row: Submission }) => (
                <div>
                    <div className="font-medium text-slate-800">{row.student?.name || `Student #${row.student_id}`}</div>
                    <div className="text-sm text-slate-500">{row.student?.email || ''}</div>
                </div>
            )
        },
        {
            header: 'Submission',
            cell: ({ row }: { row: Submission }) => (
                row.submission_type === 'FILE_UPLOAD' ? (
                    <DownloadButton label="Download File" objectName={row.file_url || ''} />
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700 font-semibold p-0 h-auto"
                        onClick={() => setReviewingAttempt({ id: row.id, name: row.student?.name || 'Student' })}
                    >
                        Review Answers
                    </Button>
                )
            )
        },
        {
            header: 'Submitted At',
            cell: ({ row }: { row: Submission }) => (
                <span className="text-sm text-slate-600">
                    {new Date(row.submitted_at).toLocaleString()}
                </span>
            )
        },
        {
            header: 'Status',
            cell: ({ row }: { row: Submission }) => {
                const isGraded = !!row.grade || row.graded_at || row.status === 'evaluated' || row.status === 'graded';
                const score = row.grade ?? row.total_score;
                const max = row.total_marks ?? 100;

                return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isGraded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                        {isGraded ? `Graded: ${score}/${max}` : 'Needs Grading'}
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: Submission }) => {
                const isGraded = !!row.grade || row.graded_at || row.status === 'evaluated' || row.status === 'graded';
                return (
                    <Button
                        variant="secondary"
                        onClick={() => handleGradeClick(row)}
                    >
                        {isGraded ? 'Update Grade' : 'Grade Submission'}
                    </Button>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Evaluations</h1>
                    <p className="text-sm text-slate-500 mt-1">Review student submissions and assign grades.</p>
                </div>
            </div>

            <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1">
                    <label htmlFor="course-select" className="block text-sm font-medium text-slate-700 mb-1">Select Course</label>
                    <select
                        id="course-select"
                        value={selectedCourse}
                        onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            setSelectedAssignment('');
                        }}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 bg-slate-50 border outline-none font-medium text-slate-700"
                    >
                        <option value="">Choose a course...</option>
                        {((courses as any)?.items || []).map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <label htmlFor="assignment-select" className="block text-sm font-medium text-slate-700 mb-1">Select Assignment</label>
                    <select
                        id="assignment-select"
                        value={selectedAssignment}
                        onChange={(e) => setSelectedAssignment(e.target.value)}
                        disabled={!selectedCourse || isMaterialsLoading}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 bg-slate-50 border outline-none font-medium text-slate-700 disabled:opacity-50"
                    >
                        <option value="">Choose an assignment...</option>
                        {assignments.map((a: any) => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedAssignment && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {isSubmissionsLoading ? (
                        <div className="p-6"><SkeletonTable rows={4} cols={5} /></div>
                    ) : (
                        <Table<Submission>
                            data={submissions || []}
                            columns={columns}
                            emptyMessage="No submissions found for this assignment yet."
                        />
                    )}
                </div>
            )}

            <Modal
                isOpen={!!gradingSubmission}
                onClose={() => {
                    setGradingSubmission(null);
                    reset();
                }}
                title={`Grade Submission for ${gradingSubmission?.student?.name || 'Student'}`}
            >
                <form onSubmit={handleSubmit(onSubmitGrade)} className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                        <span className="font-medium text-slate-700">Student Comments:</span>
                        <p className="text-slate-600 mt-1 italic">{gradingSubmission?.comments || 'No comments provided.'}</p>
                    </div>

                    <FormInput
                        label={`numericGradeOptionally/${maxGrade}`}
                        type="number"
                        placeholder={`e.g. ${Math.min(85, maxGrade)}`}
                        register={register('grade', { valueAsNumber: true })}
                        error={errors.grade?.message as string}
                    />

                    <div>
                        <label htmlFor="feedback-textarea" className="block text-sm font-medium text-slate-700 mb-1">Instructor Feedback</label>
                        <textarea
                            id="feedback-textarea"
                            {...register('feedback')}
                            placeholder="Great work on..."
                            rows={4}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border outline-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setGradingSubmission(null);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={gradeMutation.isPending}>
                            Save Grade
                        </Button>
                    </div>
                </form>
            </Modal>

            <AssessmentAnswersModal
                attemptId={reviewingAttempt?.id || null}
                studentName={reviewingAttempt?.name || ''}
                onClose={() => setReviewingAttempt(null)}
            />
        </div>
    );
};
