import React from 'react';
import { Modal } from './Modal';
import { Button } from '../Button';

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

    const getConfirmButtonStyles = () => {
        switch (variant) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 border-transparent text-white';
            case 'warning': return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 border-transparent text-white';
            case 'primary': default: return '';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title}>
            <div className="mb-6">
                <p className="text-slate-600">{message}</p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-8">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                    {cancelText}
                </button>
                <Button
                    onClick={onConfirm}
                    isLoading={isLoading}
                    className={getConfirmButtonStyles()}
                >
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
};
