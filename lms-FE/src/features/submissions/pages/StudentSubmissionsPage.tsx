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
            header: 'Assignment File',
            cell: ({ row }: { row: Submission }) => (
                <div className="flex items-center">
                    <DownloadButton label="View Submission" objectName={row.file_url} />
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
            cell: ({ row }: { row: Submission }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.graded_at
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {row.graded_at ? 'Graded' : 'Pending Review'}
                </span>
            )
        },
        {
            header: 'Grade',
            cell: ({ row }: { row: Submission }) => {
                if (!row.graded_at) return <span className="text-slate-400 italic">Not graded</span>;
                return <span className="font-bold text-slate-800">{row.grade}</span>;
            }
        },
        {
            header: 'Feedback',
            cell: ({ row }: { row: Submission }) => {
                if (!row.feedback) return <span className="text-slate-400">-</span>;
                return <p className="text-sm text-slate-600 max-w-xs break-words">{row.feedback}</p>;
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
