import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTeacherCourses } from '../hooks/useTeacherCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';
import { useAssignmentSubmissionsQuery, useGradeSubmissionMutation } from '../../submissions/hooks/useSubmissions';
import { Table } from '../../../shared/components/ui/Table';
import { Modal } from '../../../shared/components/ui/Modal';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { submissionGradeSchema, type SubmissionGradeData, type Submission } from '../../submissions/schemas';
import { SkeletonTable } from '../../../shared/components/skeleton/Skeletons';
import { DownloadButton } from '../../student/components/DownloadButton';

export const TeacherEvaluationPage: React.FC = () => {
    const { addToast } = useToastStore();

    // Filtering state
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedAssignment, setSelectedAssignment] = useState<string>('');
    const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

    // Queries
    const { data: courses } = useTeacherCourses();
    const { data: materials, isLoading: isMaterialsLoading } = useCourseMaterialsQuery(selectedCourse);
    const { data: submissions, isLoading: isSubmissionsLoading } = useAssignmentSubmissionsQuery(
        selectedAssignment ? parseInt(selectedAssignment, 10) : undefined
    );
    const gradeMutation = useGradeSubmissionMutation();

    // Form
    const { register, handleSubmit, reset, formState: { errors } } = useForm<SubmissionGradeData>({
        resolver: zodResolver(submissionGradeSchema)
    });

    const assignments = materials?.filter((m: any) => !m.file_url) || [];

    const handleGradeClick = (submission: Submission) => {
        setGradingSubmission(submission);
        reset({
            grade: submission.grade ?? undefined,
            feedback: submission.feedback || ''
        });
    };

    const onSubmitGrade = async (data: SubmissionGradeData) => {
        if (!gradingSubmission) return;

        try {
            await gradeMutation.mutateAsync({
                submissionId: gradingSubmission.id,
                data
            });
            addToast('Grade successfully applied!', 'success');
            setGradingSubmission(null);
            reset();
        } catch (error: any) {
            addToast('Failed to apply grade', 'error');
        }
    };

    const columns = [
        {
            header: 'Student',
            cell: ({ row }: { row: Submission }) => (
                <div>
                    <div className="font-medium text-slate-800">{row.student?.name || `Student #${row.student_id}`}</div>
                    <div className="text-sm text-slate-500">{row.student?.email}</div>
                </div>
            )
        },
        {
            header: 'Submission',
            cell: ({ row }: { row: Submission }) => (
                <DownloadButton label="Download File" objectName={row.file_url} />
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
            cell: ({ row }: { row: Submission }) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.graded_at ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                    {row.graded_at ? `Graded: ${row.grade}/100` : 'Needs Grading'}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: Submission }) => (
                <Button
                    variant="secondary"
                    onClick={() => handleGradeClick(row)}
                >
                    {row.graded_at ? 'Update Grade' : 'Grade Submission'}
                </Button>
            )
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
                        label="numericGradeOptionally/100"
                        type="number"
                        placeholder="e.g. 85"
                        register={register('grade', { valueAsNumber: true })}
                        error={errors.grade?.message}
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
                        <button
                            type="button"
                            onClick={() => {
                                setGradingSubmission(null);
                                reset();
                            }}
                            className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button type="submit" isLoading={gradeMutation.isPending}>
                            Save Grade
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
