import React from 'react';
import { Modal } from './Modal';
import { Button } from '../Button';
import { type ButtonVariant } from '../ButtonStyles';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "primary",
    onConfirm,
    onCancel,
    isLoading = false
}) => {

    const confirmVariant: ButtonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary';

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title}>
            <div className="mb-6">
                <p className="text-slate-600 leading-relaxed">{message}</p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-8 border-t border-slate-100 pt-5">
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    {cancelText}
                </Button>
                <Button
                    variant={confirmVariant}
                    onClick={onConfirm}
                    isLoading={isLoading}
                >
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
};

