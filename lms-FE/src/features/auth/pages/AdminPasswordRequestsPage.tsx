import React, { useState } from 'react';
import {
    usePasswordRequestsQuery,
} from '../hooks/useAuthQueries';
import {
    useApprovePasswordRequestMutation,
    useRejectPasswordRequestMutation,
} from '../hooks/useAuthMutations';
import { useToastStore } from '../../../app/store/toastStore';
import type { PasswordChangeRequestRead } from '../schemas';

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border border-rose-200',
};

const ROLE_LABEL: Record<string, string> = {
    student: '🎒 Student',
    teacher: '🏫 Teacher',
    admin: '🛡️ Admin',
    super_admin: '👑 Super Admin',
};

export const AdminPasswordRequestsPage: React.FC = () => {
    const { addToast } = useToastStore();
    const [page, setPage] = useState(1);
    const [showAll, setShowAll] = useState(false);

    const { data, isLoading, isError } = usePasswordRequestsQuery(page, 20, showAll ? undefined : 'pending');
    const approveMutation = useApprovePasswordRequestMutation();
    const rejectMutation = useRejectPasswordRequestMutation();

    const handleApprove = async (req: PasswordChangeRequestRead) => {
        try {
            await approveMutation.mutateAsync(req.id);
            addToast(`✓ Password change for ${req.user.name} approved.`, 'success');
        } catch (err: any) {
            addToast(err?.response?.data?.detail || 'Approval failed', 'error');
        }
    };

    const handleReject = async (req: PasswordChangeRequestRead) => {
        try {
            await rejectMutation.mutateAsync(req.id);
            addToast(`Password change for ${req.user.name} has been rejected`, 'info' as any);
        } catch (err: any) {
            addToast(err?.response?.data?.detail || 'Rejection failed', 'error');
        }
    };

    const totalPages = data ? Math.ceil(data.total / data.size) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Password Change Requests</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Review and approve or reject user password reset requests. Approved changes will log out the user.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setShowAll(!showAll); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${showAll
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {showAll ? 'Showing All Requests' : 'Showing Pending Only'}
                    </button>
                    {data && (
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {data.total} total
                        </span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500 animate-pulse">
                        Loading requests...
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-500 bg-rose-50">
                        Failed to load password requests.
                    </div>
                ) : !data?.items.length ? (
                    <div className="p-16 text-center">
                        <div className="text-5xl mb-4">🔐</div>
                        <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {showAll ? 'No requests found.' : 'No pending password change requests at the moment.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.items.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{req.user.name}</div>
                                        <div className="text-xs text-slate-500">{req.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-700">
                                            {ROLE_LABEL[req.user.role] || req.user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[req.status] || ''}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(req.created_at).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                        })}
                                        <div className="text-slate-400 mt-1">
                                            {new Date(req.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {req.status === 'pending' ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(req)}
                                                    disabled={approveMutation.isPending}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req)}
                                                    disabled={rejectMutation.isPending}
                                                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 disabled:opacity-60 text-rose-700 text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">
                                                {req.status === 'approved' ? `Approved on ${new Date(req.resolved_at!).toLocaleDateString()}` : `Rejected on ${new Date(req.resolved_at!).toLocaleDateString()}`}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${p === page
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
