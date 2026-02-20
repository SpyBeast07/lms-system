import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userCreateSchema, type UserCreateData } from '../schemas';
import {
    useUsersQuery,
    useCreateUserMutation,
    useDeleteUserMutation,
    useRestoreUserMutation
} from '../hooks/useUsers';
import { FormInput } from '../../../shared/components/form/FormInput';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { Table } from '../../../shared/components/ui/Table';
import { Modal } from '../../../shared/components/ui/Modal';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';
import type { User } from '../schemas';

export const UsersPage: React.FC = () => {
    const { data: users, isLoading, isError, error } = useUsersQuery();
    const createMutation = useCreateUserMutation();
    const deleteMutation = useDeleteUserMutation();
    const restoreMutation = useRestoreUserMutation();
    const { addToast } = useToastStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [userToRestore, setUserToRestore] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserCreateData>({
        resolver: zodResolver(userCreateSchema),
    });

    const onSubmit = (data: UserCreateData) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                addToast('User created successfully!', 'success');
                setIsCreateModalOpen(false);
                reset();
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to create user'), 'error');
            }
        });
    };

    const handleDeleteConfirm = () => {
        if (!userToDelete) return;

        deleteMutation.mutate(userToDelete, {
            onSuccess: () => {
                addToast('User deleted successfully.', 'success');
                setUserToDelete(null);
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to delete user'), 'error');
                setUserToDelete(null);
            }
        });
    };

    const handleRestoreConfirm = () => {
        if (!userToRestore) return;

        restoreMutation.mutate(userToRestore, {
            onSuccess: () => {
                addToast('User restored successfully.', 'success');
                setUserToRestore(null);
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to restore user'), 'error');
                setUserToRestore(null);
            }
        });
    };

    const activeUsers = users?.filter(u => !u.is_deleted) || [];
    const deletedUsers = users?.filter(u => u.is_deleted) || [];

    const activeColumns = [
        { header: 'Name', accessorKey: 'name' as keyof User },
        { header: 'Email', accessorKey: 'email' as keyof User },
        {
            header: 'Status',
            cell: ({ row }: { row: User }) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                    {row.role.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: User }) => (
                <div className="flex justify-start">
                    <button
                        onClick={() => setUserToDelete(row.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    const deletedColumns = [
        {
            header: 'Name', accessorKey: 'name' as keyof User,
            cell: ({ row }: { row: User }) => <span className="font-medium text-slate-500">{row.name}</span>
        },
        {
            header: 'Email', accessorKey: 'email' as keyof User,
            cell: ({ row }: { row: User }) => <span className="text-slate-500">{row.email}</span>
        },
        {
            header: 'Role',
            cell: ({ row }: { row: User }) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                    {row.role.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: User }) => (
                <div className="flex justify-start">
                    <button
                        onClick={() => setUserToRestore(row.id)}
                        className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-indigo-50"
                    >
                        Restore
                    </button>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="p-8 text-slate-500">Loading users...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load users: {error?.message}</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                    Create User
                </Button>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700">Active Users</h2>
                <Table<User>
                    data={activeUsers}
                    columns={activeColumns}
                    isLoading={isLoading}
                    emptyMessage="No active users found in the system."
                />
            </div>

            {deletedUsers.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700">Deleted Users</h2>
                    <Table<User>
                        data={deletedUsers}
                        columns={deletedColumns}
                        isLoading={false}
                        emptyMessage="No deleted users found."
                    />
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    reset();
                }}
                title="Create New User"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormInput
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        register={register('name')}
                        error={errors.name?.message}
                    />
                    <FormInput
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        register={register('email')}
                        error={errors.email?.message}
                    />
                    <FormInput
                        label="Temporary Password"
                        type="password"
                        placeholder="••••••••"
                        register={register('password')}
                        error={errors.password?.message}
                    />
                    <FormSelect
                        label="Role"
                        register={register('role')}
                        error={errors.role?.message}
                        options={[
                            { value: 'super_admin', label: 'Super Admin' },
                            { value: 'teacher', label: 'Teacher' },
                            { value: 'student', label: 'Student' }
                        ]}
                    />
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                reset();
                            }}
                            className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button type="submit" isLoading={createMutation.isPending}>
                            Create User
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={userToDelete !== null}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this user? This action cannot be undone."
                confirmText="Delete User"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setUserToDelete(null)}
            />

            <ConfirmDialog
                isOpen={userToRestore !== null}
                title="Confirm Restoration"
                message="Are you sure you want to restore this user? They will regain access to the platform."
                confirmText="Restore User"
                variant="primary"
                isLoading={restoreMutation.isPending}
                onConfirm={handleRestoreConfirm}
                onCancel={() => setUserToRestore(null)}
            />
        </div>
    );
};
