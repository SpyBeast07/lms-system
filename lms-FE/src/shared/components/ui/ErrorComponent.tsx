import React from 'react';
import { Button } from '../Button';

interface ErrorComponentProps {
    error: Error;
    reset: () => void;
    title?: string;
    message?: string;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({
    error,
    reset,
    title = "Something went wrong",
    message = "An unexpected error occurred while rendering this page."
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-500 max-w-md mb-8">
                {error.message || message}
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.location.reload()} variant="secondary">
                    Reload Page
                </Button>
                <Button onClick={reset} variant="primary">
                    Try Again
                </Button>
            </div>

            {import.meta.env.DEV && (
                <div className="mt-8 p-4 bg-slate-50 rounded-lg text-left overflow-auto max-w-full">
                    <p className="text-xs font-mono text-slate-400 mb-2 font-bold uppercase tracking-wider">Debug Info:</p>
                    <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">
                        {error.stack}
                    </pre>
                </div>
            )}
        </div>
    );
};
