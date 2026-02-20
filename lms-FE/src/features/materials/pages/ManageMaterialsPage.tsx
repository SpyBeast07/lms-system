import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCourseMaterialsQuery, useDeleteMaterialMutation, useUpdateMaterialMutation, useRestoreMaterialMutation } from '../hooks/useMaterials';
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses';
import { usePresignedUrlMutation } from '../../files/hooks/useFiles';
import { Table } from '../../../shared/components/ui/Table';
import { Modal } from '../../../shared/components/ui/Modal';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';

export const ManageMaterialsPage: React.FC = () => {
    const { addToast } = useToastStore();
    const { data: courses, isLoading: isCoursesLoading } = useTeacherCourses();
    const [selectedCourse, setSelectedCourse] = useState<string>('');

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<any | null>(null);

    const { data: materials, isLoading, isError } = useCourseMaterialsQuery(selectedCourse);

    // Mutations
    const deleteMutation = useDeleteMaterialMutation();
    const restoreMutation = useRestoreMaterialMutation();
    const updateMutation = useUpdateMaterialMutation();
    const presignedMutation = usePresignedUrlMutation();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<{ title: string }>();

    const openEditModal = (material: any) => {
        setEditTarget(material);
        reset({ title: material.title });
    };

    const handleEditSubmit = (data: { title: string }) => {
        if (!editTarget) return;
        updateMutation.mutate({ id: editTarget.id.toString(), data: { title: data.title } }, {
            onSuccess: () => {
                addToast('Material title updated successfully', 'success');
                setEditTarget(null);
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to update material'), 'error');
            }
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget, {
            onSuccess: () => {
                addToast('Material archived successfully', 'success');
                setDeleteTarget(null);
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to archive material'), 'error');
                setDeleteTarget(null);
            }
        });
    };

    const handleRestoreConfirm = () => {
        if (!restoreTarget) return;
        restoreMutation.mutate(restoreTarget, {
            onSuccess: () => {
                addToast('Material restored successfully', 'success');
                setRestoreTarget(null);
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to restore material'), 'error');
                setRestoreTarget(null);
            }
        });
    };

    const handleDownload = (fileUrl: string) => {
        // fileUrl is like http://localhost:9000/lms-files/uuid.pdf
        const parts = fileUrl.split('/');
        // S3 Path Style ensures bucket is part 3. Everything onwards is the pure object key:
        const objectName = parts.slice(4).join('/');

        if (!objectName) {
            addToast('Invalid file reference', 'error');
            return;
        }

        presignedMutation.mutate({ object_name: objectName }, {
            onSuccess: (data) => {
                window.open(data.url, '_blank');
            },
            onError: () => {
                addToast('Failed to generate secure download link', 'error');
            }
        });
    };

    const columns = [
        {
            header: 'Title',
            accessorKey: 'title' as any,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col">
                    <span className={`font-medium ${row.is_deleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{row.title}</span>
                </div>
            )
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
                <div className="flex justify-start gap-2">
                    {row.file_url && !row.is_deleted && (
                        <button
                            onClick={() => handleDownload(row.file_url)}
                            disabled={presignedMutation.isPending}
                            className="text-emerald-600 hover:text-emerald-800 font-medium text-sm transition-colors px-2 py-1 rounded hover:bg-emerald-50"
                        >
                            Download
                        </button>
                    )}

                    {!row.is_deleted ? (
                        <>
                            <button
                                onClick={() => openEditModal(row)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setDeleteTarget(row.id.toString())}
                                className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors px-2 py-1 rounded hover:bg-red-50"
                            >
                                Archive
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setRestoreTarget(row.id.toString())}
                            className="text-amber-600 hover:text-amber-800 font-medium text-sm transition-colors px-2 py-1 rounded hover:bg-amber-50"
                        >
                            Restore
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (isCoursesLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading assigned courses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Teacher Materials Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage all distributed curriculum, notes, and interactive assignments mapped to your courses.</p>
                </div>
            </div>

            <div className="max-w-md bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label htmlFor="course-select" className="block text-sm font-semibold text-slate-700 mb-2">Target Course Filter</label>
                <select
                    id="course-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2.5 bg-slate-50 border outline-none transition-all"
                >
                    <option value="">-- View Select Course --</option>
                    {courses?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {selectedCourse ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {isError ? (
                        <div className="p-8 text-red-500 bg-red-50 text-center font-medium">Failed to synchronize materials array from the server.</div>
                    ) : (
                        <Table<any>
                            data={materials || []}
                            columns={columns}
                            isLoading={isLoading}
                            emptyMessage="No learning materials have been structured in this course."
                        />
                    )}
                </div>
            ) : (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="text-4xl mb-4">📂</div>
                    <h3 className="text-lg font-semibold text-slate-700">No Course Active</h3>
                    <p className="text-slate-500 mt-1">Select an assigned course above to dynamically load its material repository.</p>
                </div>
            )}

            {/* Modals and Dialogs */}

            <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Material Title">
                <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
                    <FormInput
                        label="Material Title"
                        register={register('title')}
                        error={errors.title?.message}
                        placeholder="e.g. Chapter 4 Lecture Notes"
                    />
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => setEditTarget(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button type="submit" isLoading={updateMutation.isPending} variant="primary">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteTarget !== null}
                title="Archive Material"
                message="Are you sure you want to logically archive this piece of curriculum? It will immediately disappear from the students' portals until restored."
                confirmText="Archive Material"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmDialog
                isOpen={restoreTarget !== null}
                title="Restore Material"
                message="Are you sure you want to formally restore this curriculum item?"
                confirmText="Restore Record"
                variant="primary"
                isLoading={restoreMutation.isPending}
                onConfirm={handleRestoreConfirm}
                onCancel={() => setRestoreTarget(null)}
            />
        </div>
    );
};
