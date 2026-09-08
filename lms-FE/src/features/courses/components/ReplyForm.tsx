import React, { useState } from 'react';
import { Button } from '../../../shared/components/Button';

interface ReplyFormProps {
    onSubmit: (content: string, parentId?: number) => void;
    isSubmitting: boolean;
    parentId?: number;
    placeholder?: string;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({ onSubmit, isSubmitting, parentId, placeholder = "Write a reply..." }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSubmit(content, parentId);
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800"
                required
            />
            <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!content.trim()}
                isLoading={isSubmitting}
                className="whitespace-nowrap"
            >
                Reply
            </Button>
        </form>
    );
};
