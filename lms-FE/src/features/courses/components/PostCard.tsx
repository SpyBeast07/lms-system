import React from 'react';
import type { CoursePost } from '../api_discussion';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
    post: CoursePost;
    onClick: (postId: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
    const typeColors = {
        ANNOUNCEMENT: 'bg-amber-100 text-amber-800 border-amber-200',
        DISCUSSION: 'bg-blue-100 text-blue-800 border-blue-200',
        QUESTION: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    return (
        <div
            className={`p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group relative ${post.is_pinned ? 'ring-2 ring-indigo-500 ring-opacity-20' : ''}`}
            onClick={() => onClick(post.id)}
        >
            {post.is_pinned && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Pinned
                </div>
            )}

            <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeColors[post.type]}`}>
                    {post.type}
                </span>
                <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                {post.title}
            </h3>

            <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                {post.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px]">
                        👤
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                        {post.author_name || 'Anonymous'}
                    </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 text-xs">
                    💬 <span>Click to view thread</span>
                </div>
            </div>
        </div>
    );
};
