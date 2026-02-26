import { useState } from "react";
import { useSchools, useCreateSchool, useAssignPrincipal } from "../hooks";
import type { SchoolCreatePayload } from "../schemas";
import { useUsersQuery } from "../../users/hooks/useUsers";

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
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    + Add School
                </button>
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
                                    <button
                                        onClick={() => setAssignModalSchoolId(school.id)}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Assign Principal
                                    </button>
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

            {/* Basic Pagination */}
            {data && Math.ceil(data.total / data.limit) > 1 && (
                <div className="flex justify-center flex-wrap gap-2 pt-4">
                    {Array.from({ length: Math.ceil(data.total / data.limit) }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1 rounded text-sm ${page === p ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Assign Principal</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                        <select
                            required
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
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
                        {isLoadingUsers && <p className="text-xs text-blue-500 mt-1">Loading users...</p>}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={assignPrincipal.isPending || !selectedUserId}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                        >
                            {assignPrincipal.isPending ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function CreateSchoolModal({ onClose }: { onClose: () => void }) {
    const createSchool = useCreateSchool();
    const [formData, setFormData] = useState<SchoolCreatePayload>({
        name: "",
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Create New School</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                        <input
                            type="text"
                            required
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Teachers</label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            value={formData.max_teachers}
                            onChange={e => setFormData({ ...formData, max_teachers: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subscription End Date</label>
                        <input
                            type="date"
                            required
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            value={formData.subscription_end}
                            onChange={e => setFormData({ ...formData, subscription_end: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createSchool.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                        >
                            {createSchool.isPending ? 'Creating...' : 'Create School'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
