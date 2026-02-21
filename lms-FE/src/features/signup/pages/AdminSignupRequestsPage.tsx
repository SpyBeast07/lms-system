import React, { useState } from 'react';
import {
    useSignupRequestsQuery,
    useApproveSignupMutation,
    useRejectSignupMutation,
} from '../hooks';
import { useToastStore } from '../../../app/store/toastStore';
import type { SignupRequestRead } from '../schemas';

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border border-rose-200',
};

const ROLE_LABEL: Record<string, string> = {
    student: '🎒 Student',
    teacher: '🏫 Teacher',
};

export const AdminSignupRequestsPage: React.FC = () => {
    const { addToast } = useToastStore();
    const [page, setPage] = useState(1);
    const [showAll, setShowAll] = useState(false);
    const [roleOverrides, setRoleOverrides] = useState<Record<number, string>>({});

    const { data, isLoading, isError } = useSignupRequestsQuery(page, 20, showAll);
    const approveMutation = useApproveSignupMutation();
    const rejectMutation = useRejectSignupMutation();

    const handleApprove = async (req: SignupRequestRead) => {
        try {
            const override = roleOverrides[req.id];
            await approveMutation.mutateAsync({
                id: req.id,
                data: override ? { approved_role: override as 'student' | 'teacher' } : {},
            });
            addToast(`✓ ${req.name} approved as ${override || req.requested_role}`, 'success');
        } catch (err: any) {
            addToast(err?.response?.data?.detail || 'Approval failed', 'error');
        }
    };

    const handleReject = async (req: SignupRequestRead) => {
        try {
            await rejectMutation.mutateAsync(req.id);
            addToast(`${req.name}'s request has been rejected`, 'info' as any);
        } catch (err: any) {
            addToast(err?.response?.data?.detail || 'Rejection failed', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Signup Requests</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Review and approve or reject new account requests.
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
                        Loading signup requests...
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-500 bg-rose-50">
                        Failed to load signup requests.
                    </div>
                ) : !data?.items.length ? (
                    <div className="p-16 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {showAll ? 'No requests found.' : 'No pending signup requests at the moment.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested Role</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.items.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-slate-800">{req.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{req.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-700">
                                            {ROLE_LABEL[req.requested_role] || req.requested_role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[req.status]}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(req.created_at).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        {req.status === 'pending' ? (
                                            <div className="flex items-center gap-2">
                                                {/* Role override dropdown */}
                                                <select
                                                    value={roleOverrides[req.id] || ''}
                                                    onChange={(e) =>
                                                        setRoleOverrides((prev) => ({
                                                            ...prev,
                                                            [req.id]: e.target.value,
                                                        }))
                                                    }
                                                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                    title="Override role (optional)"
                                                >
                                                    <option value="">As requested</option>
                                                    <option value="student">→ Student</option>
                                                    <option value="teacher">→ Teacher</option>
                                                </select>

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
                                                {req.status === 'approved'
                                                    ? `Approved as ${req.approved_role}`
                                                    : 'Rejected'}
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
            {data && data.pages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                    {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
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
