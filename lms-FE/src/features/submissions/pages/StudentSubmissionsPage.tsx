import React from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';
import { useStudentSubmissionsQuery } from '../hooks/useSubmissions';
import { Table } from '../../../shared/components/ui/Table';
import { SkeletonTable } from '../../../shared/components/skeleton/Skeletons';
import { DownloadButton } from '../../student/components/DownloadButton';
import type { Submission } from '../schemas';

export const StudentSubmissionsPage: React.FC = () => {
    const { accessToken } = useAuthStore();
    const tokenData = accessToken ? decodeToken(accessToken) : null;
    const studentId = tokenData?.sub ? parseInt(tokenData.sub, 10) : undefined;

    const { data: submissions, isLoading, isError, error } = useStudentSubmissionsQuery(studentId);

    const columns = [
        {
            header: 'Assignment',
            cell: ({ row }: { row: Submission }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{row.title || 'Assignment'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{row.submission_type.replace('_', ' ')}</span>
                </div>
            )
        },
        {
            header: 'Submission Content',
            cell: ({ row }: { row: Submission }) => (
                <div className="flex items-center">
                    {row.submission_type === 'FILE_UPLOAD' ? (
                        <DownloadButton label="View File" objectName={row.file_url || ''} />
                    ) : (
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">Assessment Attempt</span>
                    )}
                </div>
            )
        },
        {
            header: 'Submitted At',
            cell: ({ row }: { row: Submission }) => (
                <span className="text-slate-600">
                    {new Date(row.submitted_at).toLocaleString()}
                </span>
            )
        },
        {
            header: 'Status',
            cell: ({ row }: { row: Submission }) => {
                const isEvaluated = row.status === 'evaluated' || !!row.grade;
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isEvaluated
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isEvaluated ? (row.status === 'evaluated' ? 'Evaluated' : 'Graded') : 'Pending'}
                    </span>
                );
            }
        },
        {
            header: 'Result / Score',
            cell: ({ row }: { row: Submission }) => {
                if (row.submission_type === 'FILE_UPLOAD') {
                    if (row.grade === null || row.grade === undefined) return <span className="text-slate-400 italic">Not graded</span>;
                    return <span className="font-bold text-slate-800">{row.grade}/{row.total_marks || 100}</span>;
                } else {
                    if (row.total_score === null || row.total_score === undefined) return <span className="text-slate-400 italic">Processing...</span>;
                    return (
                        <div className="flex flex-col">
                            <span className="font-black text-indigo-600 text-lg">{row.total_score}<span className="text-slate-400 text-xs font-bold"> / {row.total_marks || 100}</span></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Attempt #{row.attempt_number}</span>
                        </div>
                    );
                }
            }
        },
        {
            header: 'Feedback',
            cell: ({ row }: { row: Submission }) => {
                const feedbackText = row.submission_type === 'FILE_UPLOAD' ? row.feedback : row.teacher_feedback;
                if (!feedbackText) return <span className="text-slate-400">-</span>;
                return <p className="text-sm text-slate-600 max-w-xs break-words">{feedbackText}</p>;
            }
        }
    ];
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Submissions</h1>
                    <p className="text-sm text-slate-500 mt-1">Track your assignment submissions and grades.</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <SkeletonTable rows={5} cols={5} />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">
                Failed to load submissions: {error?.message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">My Submissions</h1>
                <p className="text-sm text-slate-500 mt-1">Track your assignment submissions and grades.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table<Submission>
                    data={submissions || []}
                    columns={columns}
                    emptyMessage="You haven't submitted any assignments yet."
                />
            </div>
        </div>
    );
};
