import React, { useState } from 'react';
import { useCourseMaterialsQuery, useDeleteMaterialMutation, useUpdateMaterialMutation } from '../hooks/useMaterials';
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses';
import { Table } from '../../../shared/components/ui/Table';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';

export const ManageMaterialsPage: React.FC = () => {
    const { addToast } = useToastStore();
    const { data: courses, isLoading: isCoursesLoading } = useTeacherCourses();
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const { data: materials, isLoading, isError, error } = useCourseMaterialsQuery(selectedCourse);
    const deleteMutation = useDeleteMaterialMutation();

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;

        deleteMutation.mutate(deleteTarget, {
            onSuccess: () => {
                addToast('Material deleted successfully', 'success');
                setDeleteTarget(null);
            },
            onError: (err: any) => {
                addToast(err?.response?.data?.detail || 'Failed to delete material', 'error');
                setDeleteTarget(null);
            }
        });
    };

    const columns = [
        {
            header: 'Title',
            accessorKey: 'title' as any,
            cell: ({ row }: { row: any }) => <span className="font-medium text-slate-800">{row.title}</span>
        },
        {
            header: 'Type',
            cell: ({ row }: { row: any }) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.file_url ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {row.file_url ? 'Note/File' : 'Assignment'}
                </span>
            )
        },
        {
            header: 'Created On',
            cell: ({ row }: { row: any }) => (
                <span className="text-slate-500 text-sm">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: any }) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => setDeleteTarget(row.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    if (isCoursesLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading assigned courses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Course Materials</h1>
                    <p className="text-sm text-slate-500 mt-1">Select a course to view and edit its notes and assignments.</p>
                </div>
            </div>

            <div className="max-w-md">
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Course Filter</label>
                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 bg-white border"
                >
                    <option value="">Choose a course...</option>
                    {courses?.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
            </div>

            {selectedCourse ? (
                <>
                    {isError ? (
                        <div className="p-8 text-red-500 bg-red-50 rounded-lg">Failed to load materials</div>
                    ) : (
                        <Table<any>
                            data={materials || []}
                            columns={columns}
                            isLoading={isLoading}
                            emptyMessage="No materials have been published to this course yet."
                        />
                    )}
                </>
            ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <span className="text-slate-500">Please select an assigned course above to view its materials.</span>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteTarget !== null}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this material? This will remove all associated student records and submissions."
                confirmText="Delete Material"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};
