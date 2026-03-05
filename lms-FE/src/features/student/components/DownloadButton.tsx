import React, { useState } from 'react';
import { usePresignedUrlMutation } from '../../files/hooks/useFiles';
import { useToastStore } from '../../../app/store/toastStore';

interface DownloadButtonProps {
    objectName?: string;
    fileUrl?: string; // Alias for objectName
    label?: string;
    variant?: 'primary' | 'indigo' | 'secondary' | 'ghost';
    className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
    objectName,
    fileUrl,
    label = 'Download',
    variant = 'primary',
    className = ''
}) => {
    const targetFile = fileUrl || objectName || '';
    const presignMutation = usePresignedUrlMutation();
    const { addToast } = useToastStore();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            if (!targetFile) {
                addToast('No file specified', 'error');
                return;
            }

            // If the backend already provided a fully generated MinIO presigned URL,
            if (targetFile.includes('X-Amz-Signature')) {
                window.open(targetFile, '_blank');
                addToast('Download started securely', 'success');
                return;
            }

            let cleanObjectName = '';

            if (targetFile.startsWith('http')) {
                const parts = targetFile.split('/');
                cleanObjectName = parts.slice(4).join('/');
            } else {
                cleanObjectName = targetFile.startsWith('/') ? targetFile.substring(1) : targetFile;
            }

            if (!cleanObjectName) {
                addToast('Invalid file reference', 'error');
                return;
            }

            setIsDownloading(true);
            const response = await presignMutation.mutateAsync({ object_name: cleanObjectName });
            window.open(response.url, '_blank');
            addToast('Download started securely', 'success');
        } catch (error) {
            console.error('Download sequence failed:', error);
            addToast('Failed to generate secure download link', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const variantClasses = {
        primary: 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 focus:ring-indigo-500',
        indigo: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30 hover:bg-indigo-500/30 focus:ring-indigo-500',
        secondary: 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 focus:ring-slate-500',
        ghost: 'text-slate-500 hover:bg-slate-100 border-transparent focus:ring-slate-500'
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading || presignMutation.isPending}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variantClasses[variant]} ${className}`}
        >
            {isDownloading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {label}
                </>
            )}
        </button>
    );
};
