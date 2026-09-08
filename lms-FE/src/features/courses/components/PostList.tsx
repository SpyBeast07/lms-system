import React from 'react';
import { PostCard } from './PostCard';
import type { CoursePost } from '../api_discussion';

interface PostListProps {
    posts: CoursePost[];
    onSelectPost: (postId: number) => void;
    isLoading: boolean;
}

export const PostList: React.FC<PostListProps> = ({ posts, onSelectPost, isLoading }) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-medium text-slate-800">No discussions yet</h3>
                <p className="text-slate-500 text-sm mt-1">Be the first one to start a conversation!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    onClick={onSelectPost}
                />
            ))}
        </div>
    );
};
