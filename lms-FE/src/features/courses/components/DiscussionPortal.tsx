import React, { useState } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { useCoursePostsQuery, usePostQuery, useCreatePostMutation, useReplyMutation } from '../hooks/useDiscussions';
import { PostList } from './PostList';
import { PostForm } from './PostForm';
import { PostThread } from './PostThread';
import type { CoursePost } from '../api_discussion';
import { Button } from '../../../shared/components/Button';
import { useCourseWebSocket } from '../hooks/useCourseWebSocket';

interface DiscussionPortalProps {
    courseId: string;
}

export const DiscussionPortal: React.FC<DiscussionPortalProps> = ({ courseId }) => {
    useCourseWebSocket(courseId);
    
    const { userRole } = useAuthStore();
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [showPostForm, setShowPostForm] = useState(false);
    const [filterType, setFilterType] = useState<string | undefined>(undefined);

    const { data: posts, isLoading: isLoadingPosts } = useCoursePostsQuery(courseId, filterType);
    const { data: selectedPost, isLoading: isLoadingPost } = usePostQuery(selectedPostId || 0);

    const createPostMutation = useCreatePostMutation(courseId);
    const replyMutation = useReplyMutation(selectedPostId || 0);

    // Reset state when courseId changes
    React.useEffect(() => {
        setSelectedPostId(null);
        setShowPostForm(false);
    }, [courseId]);

    const handleCreatePost = async (data: Partial<CoursePost>) => {
        await createPostMutation.mutateAsync(data);
        setShowPostForm(false);
    };

    const handleReply = async (content: string, parentId?: number) => {
        if (!selectedPostId) return;
        await replyMutation.mutateAsync({ content, parent_reply_id: parentId });
    };

    if (selectedPostId && selectedPost) {
        return (
            <PostThread
                post={selectedPost}
                onBack={() => setSelectedPostId(null)}
                onReply={handleReply}
                isReplying={replyMutation.isPending}
            />
        );
    }

    if (selectedPostId && isLoadingPost) {
        return <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading discussion thread...</div>;
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Community Feed</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Interact with teachers and fellow students</p>
                </div>

                <Button
                    onClick={() => setShowPostForm(!showPostForm)}
                    variant={showPostForm ? 'secondary' : 'primary'}
                    className="shadow-md hover:shadow-lg rounded-xl"
                >
                    {showPostForm ? '✕ Close Form' : '✍️ Create New Post'}
                </Button>
            </div>

            {showPostForm && (
                <div className="animate-in slide-in-from-top duration-300">
                    <PostForm
                        onSubmit={handleCreatePost}
                        isSubmitting={createPostMutation.isPending}
                        userRole={userRole || 'student'}
                    />
                </div>
            )}

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                <Button
                    onClick={() => setFilterType(undefined)}
                    variant={!filterType ? 'secondary' : 'outline'}
                    size="sm"
                    className="rounded-full whitespace-nowrap"
                >
                    All Posts
                </Button>
                <Button
                    onClick={() => setFilterType('ANNOUNCEMENT')}
                    variant={filterType === 'ANNOUNCEMENT' ? 'warning' : 'outline'}
                    size="sm"
                    className="rounded-full whitespace-nowrap"
                >
                    Announcements
                </Button>
                <Button
                    onClick={() => setFilterType('DISCUSSION')}
                    variant={filterType === 'DISCUSSION' ? 'primary' : 'outline'}
                    size="sm"
                    className="rounded-full whitespace-nowrap"
                >
                    Discussions
                </Button>
                <Button
                    onClick={() => setFilterType('QUESTION')}
                    variant={filterType === 'QUESTION' ? 'secondary' : 'outline'}
                    size="sm"
                    className="rounded-full whitespace-nowrap"
                >
                    Questions
                </Button>
            </div>

            <PostList
                posts={posts || []}
                onSelectPost={setSelectedPostId}
                isLoading={isLoadingPosts}
            />
        </div>
    );
};
