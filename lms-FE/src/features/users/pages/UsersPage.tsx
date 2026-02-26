import React, { useState, useReducer } from 'react';
import {
    useUsersQuery,
    useCreateUserMutation,
    useDeleteUserMutation,
    useRestoreUserMutation,
    useHardDeleteUserMutation
} from '../hooks/useUsers';
import { Button } from '../../../shared/components/Button';
import { SkeletonTable } from '../../../shared/components/skeleton/Skeletons';
import { mutationToastHandlers } from '../../../shared/utils/queryToastHelpers';
import { useAuthStore } from '../../../app/store/authStore';
import type { User, UserCreateData } from '../schemas';
import { UserCreateModal } from '../components/UserCreateModal';
import { UserListSection } from '../components/UserListSection';
import { UserConfirmations } from '../components/UserConfirmations';

type UiState = {
    isCreateModalOpen: boolean;
    userToDelete: string | null;
    userToRestore: string | null;
    userToHardDelete: string | null;
};

type UiAction =
    | { type: 'OPEN_CREATE' }
    | { type: 'CLOSE_CREATE' }
    | { type: 'SET_DELETE'; id: string | null }
    | { type: 'SET_RESTORE'; id: string | null }
    | { type: 'SET_HARD_DELETE'; id: string | null };

const uiReducer = (state: UiState, action: UiAction): UiState => {
    switch (action.type) {
        case 'OPEN_CREATE': return { ...state, isCreateModalOpen: true };
        case 'CLOSE_CREATE': return { ...state, isCreateModalOpen: false };
        case 'SET_DELETE': return { ...state, userToDelete: action.id };
        case 'SET_RESTORE': return { ...state, userToRestore: action.id };
        case 'SET_HARD_DELETE': return { ...state, userToHardDelete: action.id };
        default: return state;
    }
};

export const UsersPage: React.FC = () => {
    const [activePage, setActivePage] = useState(1);
    const [deletedPage, setDeletedPage] = useState(1);
    const limit = 10;

    const activeQuery = useUsersQuery(activePage, limit, false);
    const deletedQuery = useUsersQuery(deletedPage, limit, true);

    const { accessToken } = useAuthStore();
    const payload = accessToken ? JSON.parse(atob(accessToken.split('.')[1])) : null;
    const currentUserRole = payload?.role;

    const roleOptions = (() => {
        if (currentUserRole === 'super_admin') {
            return [
                { value: 'super_admin', label: 'Super Admin' },
                { value: 'principal', label: 'Principal' }
            ];
        }
        if (currentUserRole === 'principal') {
            return [
                { value: 'teacher', label: 'Teacher' }
            ];
        }
        return [
            { value: 'student', label: 'Student' }
        ];
    })();

    const createMutation = useCreateUserMutation();
    const deleteMutation = useDeleteUserMutation();
    const restoreMutation = useRestoreUserMutation();
    const hardDeleteMutation = useHardDeleteUserMutation();

    const [ui, dispatch] = useReducer(uiReducer, {
        isCreateModalOpen: false,
        userToDelete: null,
        userToRestore: null,
        userToHardDelete: null,
    });
    const { isCreateModalOpen, userToDelete, userToRestore, userToHardDelete } = ui;

    const handleCreateSubmit = (data: UserCreateData) => {
        createMutation.mutate(data, mutationToastHandlers(
            'User created successfully!',
            undefined,
            () => dispatch({ type: 'CLOSE_CREATE' })
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

    const handleHardDeleteConfirm = () => {
        if (!userToHardDelete) return;
        hardDeleteMutation.mutate(userToHardDelete, mutationToastHandlers(
            'User permanently deleted.',
            undefined,
            () => dispatch({ type: 'SET_HARD_DELETE', id: null }),
            () => dispatch({ type: 'SET_HARD_DELETE', id: null })
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
                <div className="flex justify-start gap-2">
                    <button
                        onClick={() => dispatch({ type: 'SET_RESTORE', id: row.id })}
                        className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-indigo-50"
                    >
                        Restore
                    </button>
                    {(currentUserRole === 'super_admin' || currentUserRole === 'principal' || currentUserRole === 'teacher') && (
                        <button
                            onClick={() => dispatch({ type: 'SET_HARD_DELETE', id: row.id })}
                            className="text-rose-500 hover:text-rose-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-rose-50"
                        >
                            Hard Delete
                        </button>
                    )}
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

            <UserListSection
                title="Active Users"
                users={activeUsers}
                columns={activeColumns}
                currentPage={activePage}
                totalItems={(activeQuery.data as any)?.total || 0}
                pageSize={limit}
                onPageChange={setActivePage}
                isLoading={activeQuery.isLoading}
                emptyMessage="No active users found."
            />

            <UserListSection
                title="Deleted Users"
                users={deletedUsers}
                columns={deletedColumns}
                currentPage={deletedPage}
                totalItems={(deletedQuery.data as any)?.total || 0}
                pageSize={limit}
                onPageChange={setDeletedPage}
                isLoading={deletedQuery.isLoading}
                emptyMessage="No deleted users found."
            />

            <UserCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => dispatch({ type: 'CLOSE_CREATE' })}
                onSubmit={handleCreateSubmit}
                isSubmitting={createMutation.isPending}
                roleOptions={roleOptions}
            />

            <UserConfirmations
                userToDelete={userToDelete}
                userToRestore={userToRestore}
                userToHardDelete={userToHardDelete}
                onDeleteConfirm={handleDeleteConfirm}
                onRestoreConfirm={handleRestoreConfirm}
                onHardDeleteConfirm={handleHardDeleteConfirm}
                onCancel={(type) => {
                    if (type === 'delete') dispatch({ type: 'SET_DELETE', id: null });
                    if (type === 'restore') dispatch({ type: 'SET_RESTORE', id: null });
                    if (type === 'hardDelete') dispatch({ type: 'SET_HARD_DELETE', id: null });
                }}
                isDeleting={deleteMutation.isPending}
                isRestoring={restoreMutation.isPending}
                isHardDeleting={hardDeleteMutation.isPending}
            />
        </div>
    );
};
