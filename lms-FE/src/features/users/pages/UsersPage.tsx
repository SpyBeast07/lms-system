import React, { useState, useReducer } from 'react';
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
import { SkeletonTable } from '../../../shared/components/skeleton/Skeletons';
import { mutationToastHandlers } from '../../../shared/utils/queryToastHelpers';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { User } from '../schemas';

type UiState = {
    isCreateModalOpen: boolean;
    userToDelete: string | null;
    userToRestore: string | null;
};

type UiAction =
    | { type: 'OPEN_CREATE' }
    | { type: 'CLOSE_CREATE' }
    | { type: 'SET_DELETE'; id: string | null }
    | { type: 'SET_RESTORE'; id: string | null };

const uiReducer = (state: UiState, action: UiAction): UiState => {
    switch (action.type) {
        case 'OPEN_CREATE': return { ...state, isCreateModalOpen: true };
        case 'CLOSE_CREATE': return { ...state, isCreateModalOpen: false };
        case 'SET_DELETE': return { ...state, userToDelete: action.id };
        case 'SET_RESTORE': return { ...state, userToRestore: action.id };
        default: return state;
    }
};

export const UsersPage: React.FC = () => {
    const [activePage, setActivePage] = useState(1);
    const [deletedPage, setDeletedPage] = useState(1);
    const limit = 10;

    const activeQuery = useUsersQuery(activePage, limit, false);
    const deletedQuery = useUsersQuery(deletedPage, limit, true);

    const createMutation = useCreateUserMutation();
    const deleteMutation = useDeleteUserMutation();
    const restoreMutation = useRestoreUserMutation();

    const [ui, dispatch] = useReducer(uiReducer, {
        isCreateModalOpen: false,
        userToDelete: null,
        userToRestore: null,
    });
    const { isCreateModalOpen, userToDelete, userToRestore } = ui;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserCreateData>({
        resolver: zodResolver(userCreateSchema),
    });

    const onSubmit = (data: UserCreateData) => {
        createMutation.mutate(data, mutationToastHandlers(
            'User created successfully!',
            undefined,
            () => {
                dispatch({ type: 'CLOSE_CREATE' });
                reset();
            }
        ));
    };

    const handleDeleteConfirm = () => {
        if (!userToDelete) return;

        deleteMutation.mutate(userToDelete, mutationToastHandlers(
            'User deleted successfully.',
            undefined,
            () => dispatch({ type: 'SET_DELETE', id: null }),
            () => dispatch({ type: 'SET_DELETE', id: null })
        ));
    };

    const handleRestoreConfirm = () => {
        if (!userToRestore) return;

        restoreMutation.mutate(userToRestore, mutationToastHandlers(
            'User restored successfully.',
            undefined,
            () => dispatch({ type: 'SET_RESTORE', id: null }),
            () => dispatch({ type: 'SET_RESTORE', id: null })
        ));
    };

    const activeUsers: User[] = (activeQuery.data as any)?.items || [];
    const deletedUsers: User[] = (deletedQuery.data as any)?.items || [];

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
                        onClick={() => dispatch({ type: 'SET_DELETE', id: row.id })}
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
                        onClick={() => dispatch({ type: 'SET_RESTORE', id: row.id })}
                        className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-indigo-50"
                    >
                        Restore
                    </button>
                </div>
            )
        }
    ];

    if (activeQuery.isLoading || deletedQuery.isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
                    <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-lg"></div>
                </div>
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-slate-200 animate-pulse rounded"></div>
                    <SkeletonTable rows={5} cols={4} />
                </div>
            </div>
        );
    }
    if (activeQuery.isError || deletedQuery.isError) {
        return (
            <div className="p-8 text-red-500">
                Failed to load users: {activeQuery.error?.message || deletedQuery.error?.message}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })} variant="primary">
                    Create User
                </Button>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700">Active Users</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <Table<User>
                        data={activeUsers}
                        columns={activeColumns}
                        emptyMessage="No active users found."
                    />
                    <Pagination
                        currentPage={activePage}
                        totalItems={(activeQuery.data as any)?.total || 0}
                        pageSize={limit}
                        onPageChange={setActivePage}
                        isLoading={activeQuery.isLoading}
                    />
                </div>
            </div>

            {((deletedQuery.data as any)?.total > 0 || deletedUsers.length > 0) && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700">Deleted Users</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <Table<User>
                            data={deletedUsers}
                            columns={deletedColumns}
                            isLoading={false}
                            emptyMessage="No deleted users found."
                        />
                        <Pagination
                            currentPage={deletedPage}
                            totalItems={(deletedQuery.data as any)?.total || 0}
                            pageSize={limit}
                            onPageChange={setDeletedPage}
                            isLoading={deletedQuery.isLoading}
                        />
                    </div>
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    dispatch({ type: 'CLOSE_CREATE' });
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
                                dispatch({ type: 'CLOSE_CREATE' });
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
                onCancel={() => dispatch({ type: 'SET_DELETE', id: null })}
            />

            <ConfirmDialog
                isOpen={userToRestore !== null}
                title="Confirm Restoration"
                message="Are you sure you want to restore this user? They will regain access to the platform."
                confirmText="Restore User"
                variant="primary"
                isLoading={restoreMutation.isPending}
                onConfirm={handleRestoreConfirm}
                onCancel={() => dispatch({ type: 'SET_RESTORE', id: null })}
            />
        </div>
    );
};
