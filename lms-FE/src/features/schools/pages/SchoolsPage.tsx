import { useState } from "react";
import { useSchools, useCreateSchool, useAssignPrincipal } from "../hooks";
import type { SchoolCreatePayload } from "../schemas";
import { useUsersQuery } from "../../users/hooks/useUsers";
import { Button } from "../../../shared/components/Button";
import { Pagination } from "../../../shared/components/ui/Pagination";

export default function SchoolsPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useSchools(page, 10);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [assignModalSchoolId, setAssignModalSchoolId] = useState<number | null>(null);

    if (isLoading) return <div className="p-8">Loading schools...</div>;
    if (error) return <div className="p-8 text-red-500">Failed to load schools</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Schools Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage tenant schools and principles.</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="primary"
                >
                    + Add School
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                            <th className="p-4">ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Principal</th>
                            <th className="p-4">Max Teachers</th>
                            <th className="p-4">Subscription Start</th>
                            <th className="p-4">Subscription End</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data?.items.map((school) => (
                            <tr key={school.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="p-4 text-sm text-gray-500">#{school.id}</td>
                                <td className="p-4">
                                    <span className="font-medium text-gray-900">{school.name}</span>
                                </td>
                                <td className="p-4">
                                    {school.principal ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{school.principal.name}</span>
                                            <span className="text-xs text-gray-500">{school.principal.email}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        {school.max_teachers}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {new Date(school.subscription_start).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {new Date(school.subscription_end).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                </td>
                                <td className="p-4 text-sm">
                                    <Button
                                        onClick={() => setAssignModalSchoolId(school.id)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Assign Principal
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {(!data?.items || data.items.length === 0) && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                                    No schools found. Add your first tenant above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Shared Pagination component */}
            {data && (
                <Pagination
                    currentPage={page}
                    totalItems={data.total}
                    pageSize={data.limit}
                    onPageChange={setPage}
                />
            )}

            {isCreateModalOpen && (
                <CreateSchoolModal onClose={() => setIsCreateModalOpen(false)} />
            )}

            {assignModalSchoolId !== null && (
                <AssignPrincipalModal
                    schoolId={assignModalSchoolId}
                    onClose={() => setAssignModalSchoolId(null)}
                />
            )}
        </div>
    );
}


import { Modal } from "../../../shared/components/ui/Modal";

function AssignPrincipalModal({ schoolId, onClose }: { schoolId: number; onClose: () => void }) {
    const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery(1, 1000);
    const assignPrincipal = useAssignPrincipal(schoolId);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return;
        assignPrincipal.mutate({ user_id: Number(selectedUserId) }, {
            onSuccess: () => {
                alert("Principal assigned successfully!");
                onClose();
            },
            onError: (err: any) => alert(err?.response?.data?.detail || "Failed to assign principal")
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Assign Principal">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="select-user" className="block text-sm font-medium text-slate-700 mb-1">Select User</label>
                    <select
                        id="select-user"
                        required
                        className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5 border bg-slate-50 outline-none"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(Number(e.target.value))}
                        disabled={isLoadingUsers}
                    >
                        <option value="" disabled>-- Select a User --</option>
                        {(usersData as any)?.items
                            ?.filter((u: any) => !u.is_deleted && (u.role === "principal" || u.role === "teacher"))
                            .map((user: any) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email}) - {user.role}
                                </option>
                            ))}
                    </select>
                    {isLoadingUsers && <p className="text-xs text-indigo-500 mt-1">Loading users...</p>}
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={assignPrincipal.isPending || !selectedUserId}
                        isLoading={assignPrincipal.isPending}
                    >
                        Assign
                    </Button>
                </div>
            </form>
        </Modal>
    );
}


function CreateSchoolModal({ onClose }: { onClose: () => void }) {
    const createSchool = useCreateSchool();
    const [formData, setFormData] = useState<SchoolCreatePayload>({
        name: "",
        subscription_start: new Date().toISOString().split('T')[0],
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        max_teachers: 10
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createSchool.mutate(formData, {
            onSuccess: () => onClose(),
            onError: (err: any) => alert(err?.response?.data?.detail || "Failed to create school")
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Create New School">
            <form onSubmit={handleSubmit} className="p-1 space-y-4">
                <div>
                    <label htmlFor="school-name" className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                    <input
                        id="school-name"
                        type="text"
                        required
                        className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5 border outline-none bg-slate-50"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="max-teachers" className="block text-sm font-medium text-slate-700 mb-1">Max Teachers</label>
                        <input
                            id="max-teachers"
                            type="number"
                            required
                            min="1"
                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5 border outline-none bg-slate-50"
                            value={formData.max_teachers}
                            onChange={e => setFormData({ ...formData, max_teachers: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="subscription-start" className="block text-sm font-medium text-slate-700 mb-1 text-xs uppercase tracking-wider">Start Date</label>
                        <input
                            id="subscription-start"
                            type="date"
                            required
                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border outline-none bg-slate-50"
                            value={formData.subscription_start}
                            onChange={e => setFormData({ ...formData, subscription_start: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="subscription-end" className="block text-sm font-medium text-slate-700 mb-1 text-xs uppercase tracking-wider">End Date</label>
                        <input
                            id="subscription-end"
                            type="date"
                            required
                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border outline-none bg-slate-50"
                            value={formData.subscription_end}
                            onChange={e => setFormData({ ...formData, subscription_end: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={createSchool.isPending}
                    >
                        Create School
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

