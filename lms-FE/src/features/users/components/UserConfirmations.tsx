import React from 'react';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';

interface UserConfirmationsProps {
    userToDelete: string | null;
    userToRestore: string | null;
    userToHardDelete: string | null;
    onDeleteConfirm: () => void;
    onRestoreConfirm: () => void;
    onHardDeleteConfirm: () => void;
    onCancel: (type: 'delete' | 'restore' | 'hardDelete') => void;
    isDeleting: boolean;
    isRestoring: boolean;
    isHardDeleting: boolean;
}

export const UserConfirmations: React.FC<UserConfirmationsProps> = ({
    userToDelete,
    userToRestore,
    userToHardDelete,
    onDeleteConfirm,
    onRestoreConfirm,
    onHardDeleteConfirm,
    onCancel,
    isDeleting,
    isRestoring,
    isHardDeleting,
}) => {
    return (
        <>
            <ConfirmDialog
                isOpen={userToDelete !== null}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this user? This action cannot be undone."
                confirmText="Delete User"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={onDeleteConfirm}
                onCancel={() => onCancel('delete')}
            />

            <ConfirmDialog
                isOpen={userToRestore !== null}
                title="Confirm Restoration"
                message="Are you sure you want to restore this user? They will regain access to the platform."
                confirmText="Restore User"
                variant="primary"
                isLoading={isRestoring}
                onConfirm={onRestoreConfirm}
                onCancel={() => onCancel('restore')}
            />

            <ConfirmDialog
                isOpen={userToHardDelete !== null}
                title="Confirm Permanent Deletion"
                message="Are you sure you want to PERMANENTLY delete this user? This action CANNOT be undone and will remove all their data from the system."
                confirmText="Permanently Delete"
                variant="danger"
                isLoading={isHardDeleting}
                onConfirm={onHardDeleteConfirm}
                onCancel={() => onCancel('hardDelete')}
            />
        </>
    );
};
