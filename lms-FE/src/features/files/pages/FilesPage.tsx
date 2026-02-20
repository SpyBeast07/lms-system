import React, { useState } from 'react';
import { useFilesQuery, useDeleteFileMutation, usePresignedUrlMutation } from '../hooks/useFiles';
import { Table } from '../../../shared/components/ui/Table';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { useToastStore } from '../../../app/store/toastStore';
import type { FileInfo } from '../schemas';

export const FilesPage: React.FC = () => {
    const { data: files, isLoading } = useFilesQuery();
    const deleteMutation = useDeleteFileMutation();
    const presignedUrlMutation = usePresignedUrlMutation();
    const { addToast } = useToastStore();

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const handleViewFile = async (objectName: string) => {
        try {
            const res = await presignedUrlMutation.mutateAsync({ object_name: objectName });
            window.open(res.url, '_blank');
        } catch (error) {
            addToast('Failed to generate secure viewing link', 'error');
        }
    };

    const handleCopyLink = async (objectName: string) => {
        try {
            const res = await presignedUrlMutation.mutateAsync({ object_name: objectName });
            await navigator.clipboard.writeText(res.url);
            addToast('Secure link copied to clipboard', 'success');
        } catch (error) {
            addToast('Failed to copy secure link', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        deleteMutation.mutate(deleteTarget, {
            onSuccess: () => {
                addToast('File securely deleted', 'success');
                setDeleteTarget(null);
            },
            onError: () => {
                addToast('Failed to delete file', 'error');
                setDeleteTarget(null);
            }
        });
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">File Storage</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor and manage centralized content uploads securely.</p>
                </div>
            </div>

            <Table<FileInfo>
                data={files || []}
                isLoading={isLoading}
                emptyMessage="No files uploaded yet"
                columns={[
                    {
                        header: 'File Name',
                        accessorKey: 'object_name',
                        cell: ({ row }) => (
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{row.object_name}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Size',
                        accessorKey: 'size',
                        cell: ({ row }) => <span className="tabular-nums">{formatBytes(row.size)}</span>
                    },
                    {
                        header: 'Upload Date',
                        accessorKey: 'last_modified',
                        cell: ({ row }) => <span className="tabular-nums">{formatDate(row.last_modified)}</span>
                    },
                    {
                        header: 'Actions',
                        cell: ({ row }) => (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleViewFile(row.object_name)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="View File"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleCopyLink(row.object_name)}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Copy Link"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(row.object_name)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete File"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        )
                    }
                ]}
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete File"
                message={`Are you sure you want to permanently delete "${deleteTarget}"? This action cannot be reversed and will sever all database links referencing this file.`}
                confirmText={deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};
