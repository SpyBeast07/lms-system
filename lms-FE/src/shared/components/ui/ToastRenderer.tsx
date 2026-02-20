import React from 'react';
import { useToastStore, type Toast } from '../../../app/store/toastStore';

export const ToastRenderer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast: Toast) => {
                const getColors = () => {
                    switch (toast.type) {
                        case 'success':
                            return 'bg-green-50 text-green-800 border-green-200';
                        case 'error':
                            return 'bg-red-50 text-red-800 border-red-200';
                        case 'info':
                        default:
                            return 'bg-blue-50 text-blue-800 border-blue-200';
                    }
                };

                const getIcon = () => {
                    switch (toast.type) {
                        case 'success':
                            return (
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            );
                        case 'error':
                            return (
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            );
                        case 'info':
                        default:
                            return (
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            );
                    }
                };

                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out ${getColors()}`}
                        role="alert"
                    >
                        {getIcon()}
                        <p className="font-medium text-sm">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 p-1 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
