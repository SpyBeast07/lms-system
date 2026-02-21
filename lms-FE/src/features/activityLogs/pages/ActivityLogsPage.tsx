import React, { useState } from 'react';
import { useActivityLogsQuery } from '../hooks/useActivityLogs';
import type { ActivityLog } from '../schemas';
import { Table } from '../../../shared/components/ui/Table';
import { SkeletonTable } from '../../../shared/components/skeleton/Skeletons';

export const ActivityLogsPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState<string>('');
    const [userIdFilter, setUserIdFilter] = useState<string>('');

    const queryFilters = {
        page,
        size: 15,
        action: actionFilter || undefined,
        user_id: userIdFilter ? parseInt(userIdFilter, 10) : undefined,
    };

    const { data: logsData, isLoading, isError } = useActivityLogsQuery(queryFilters);

    const columns = [
        {
            header: 'Time',
            cell: ({ row }: { row: ActivityLog }) => (
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                </span>
            )
        },
        {
            header: 'User',
            cell: ({ row }: { row: ActivityLog }) => (
                <div className="flex items-center gap-2">
                    {row.user ? (
                        <>
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                                {row.user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-800">{row.user.name}</div>
                                <div className="text-xs text-slate-500">{row.user.role}</div>
                            </div>
                        </>
                    ) : (
                        <span className="text-sm text-slate-400 italic">System</span>
                    )}
                </div>
            )
        },
        {
            header: 'Action',
            cell: ({ row }: { row: ActivityLog }) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {row.action}
                </span>
            )
        },
        {
            header: 'Details',
            cell: ({ row }: { row: ActivityLog }) => (
                <div className="text-sm text-slate-600 max-w-md truncate">
                    {row.details || '-'}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Activity Logs</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor system events and user actions.</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="action-filter" className="block text-xs font-medium text-slate-700 mb-1">Filter by Action</label>
                    <select
                        id="action-filter"
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setPage(1); // Reset to page 1 on filter
                        }}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 bg-slate-50 border outline-none font-medium text-slate-700"
                    >
                        <option value="">All Actions</option>
                        <option value="login">Login</option>
                        <option value="create_assignment">Create Assignment</option>
                        <option value="create_notes">Create Notes</option>
                        <option value="assignment_graded">Submission Graded</option>
                        <option value="create_course">Create Course</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="user-id-filter" className="block text-xs font-medium text-slate-700 mb-1">Filter by User ID</label>
                    <input
                        id="user-id-filter"
                        type="number"
                        placeholder="e.g. 1"
                        value={userIdFilter}
                        onChange={(e) => {
                            setUserIdFilter(e.target.value);
                            setPage(1);
                        }}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 bg-slate-50 border outline-none font-medium text-slate-700"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-6"><SkeletonTable rows={10} cols={4} /></div>
                ) : isError ? (
                    <div className="p-10 text-center text-red-500 bg-red-50">
                        Failed to load activity logs. Please try again.
                    </div>
                ) : (
                    <>
                        <Table<ActivityLog>
                            data={logsData?.items || []}
                            columns={columns}
                            emptyMessage="No activity logs found matching the criteria."
                        />

                        {/* Pagination Footer */}
                        {logsData && logsData.pages > 1 && (
                            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 bg-slate-50">
                                <span className="text-sm text-slate-600">
                                    Page <span className="font-semibold text-slate-800">{page}</span> of <span className="font-semibold text-slate-800">{logsData.pages}</span>
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(logsData.pages, p + 1))}
                                        disabled={page === logsData.pages}
                                        className="px-3 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
