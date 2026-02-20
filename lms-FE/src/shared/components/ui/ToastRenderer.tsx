import React from 'react';
import { useToastStore, type Toast, type ToastType } from '../../../app/store/toastStore';

const toastStyles: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const toastIcons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
};

export const ToastRenderer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            {toasts.map((toast: Toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-start gap-3 p-4 rounded-xl border shadow-lg
                        animate-in slide-in-from-right-10 fade-in duration-300
                        ${toastStyles[toast.type]}
                    `}
                >
                    <span className="text-xl shrink-0">{toastIcons[toast.type]}</span>
                    <div className="flex-1 text-sm font-medium leading-relaxed">
                        {toast.message}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};
