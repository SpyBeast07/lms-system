import React, { useState } from 'react';
import { usePresignedUrlMutation } from '../../files/hooks/useFiles';
import { useToastStore } from '../../../app/store/toastStore';

interface DownloadButtonProps {
    objectName: string;
    label?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ objectName, label = 'Download' }) => {
    const presignMutation = usePresignedUrlMutation();
    const { addToast } = useToastStore();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const response = await presignMutation.mutateAsync({ object_name: objectName });

            // Open the secure MinIO S3 presigned URL implicitly natively
            window.open(response.url, '_blank');
            addToast('Download started securely', 'success');
        } catch (error) {
            console.error('Download sequence failed:', error);
            addToast('Failed to generate secure download link', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading || presignMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
