import React, { useState } from 'react';
import type { CoursePost } from '../api_discussion';
import { Button } from '../../../shared/components/Button';

interface PostFormProps {
    onSubmit: (data: Partial<CoursePost>) => void;
    isSubmitting: boolean;
    userRole: string;
}

export const PostForm: React.FC<PostFormProps> = ({ onSubmit, isSubmitting, userRole }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'ANNOUNCEMENT' | 'DISCUSSION' | 'QUESTION'>(
        userRole === 'teacher' || userRole === 'principal' ? 'ANNOUNCEMENT' : 'DISCUSSION'
    );
    const [isPinned, setIsPinned] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;
        onSubmit({ title, content, type, is_pinned: isPinned });
        setTitle('');
        setContent('');
    };

    const isAdmin = userRole === 'teacher' || userRole === 'principal' || userRole === 'super_admin';

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Create New Post</h3>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Post Type</label>
                <div className="flex flex-wrap gap-2">
                    {isAdmin && (
                        <Button
                            type="button"
                            onClick={() => setType('ANNOUNCEMENT')}
                            variant={type === 'ANNOUNCEMENT' ? 'warning' : 'outline'}
                            size="sm"
                        >
                            📢 Announcement
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={() => setType('DISCUSSION')}
                        variant={type === 'DISCUSSION' ? 'primary' : 'outline'}
                        size="sm"
                    >
                        💬 Discussion
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setType('QUESTION')}
                        variant={type === 'QUESTION' ? 'secondary' : 'outline'}
                        size="sm"
                    >
                        ❓ Question
                    </Button>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Important update about tomorrow's session"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
                    required
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Content</label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe your post in detail..."
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-32 text-slate-800 resize-none"
                    required
                />
            </div>

            {isAdmin && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isPinned"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <label htmlFor="isPinned" className="text-sm font-medium text-slate-600">
                        Pin this post to top
                    </label>
                </div>
            )}

            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={!title || !content}
                    isLoading={isSubmitting}
                >
                    Create Post
                </Button>
            </div>
        </form>
    );
};
