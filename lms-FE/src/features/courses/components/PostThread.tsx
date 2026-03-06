import React from 'react';
import type { CoursePost, PostReply } from '../api_discussion';
import { ReplyForm } from './ReplyForm';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../../shared/components/Button';

interface PostThreadProps {
    post: CoursePost;
    onBack: () => void;
    onReply: (content: string, parentId?: number) => void;
    isReplying: boolean;
}

const ReplyItem: React.FC<{ reply: PostReply; onReply: (content: string, parentId?: number) => void; isReplying: boolean }> = ({ reply, onReply, isReplying }) => {
    const [isReplyingToThis, setIsReplyingToThis] = React.useState(false);

    return (
        <div className="pl-4 border-l-2 border-slate-100 py-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[8px]">👤</div>
                <span className="text-xs font-bold text-slate-700">{reply.author_name || 'User'}</span>
                <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{reply.content}</p>
            <Button
                variant="indigo-ghost"
                size="xs"
                onClick={() => setIsReplyingToThis(!isReplyingToThis)}
            >
                {isReplyingToThis ? 'Cancel' : 'Reply'}
            </Button>

            {isReplyingToThis && (
                <div className="mt-2 ml-4">
                    <ReplyForm
                        onSubmit={(content) => {
                            onReply(content, reply.id);
                            setIsReplyingToThis(false);
                        }}
                        isSubmitting={isReplying}
                        placeholder={`Replying to ${reply.author_name || 'User'}...`}
                    />
                </div>
            )}
        </div>
    );
};

export const PostThread: React.FC<PostThreadProps> = ({ post, onBack, onReply, isReplying }) => {
    const typeColors = {
        ANNOUNCEMENT: 'bg-amber-100 text-amber-800 border-amber-200',
        DISCUSSION: 'bg-blue-100 text-blue-800 border-blue-200',
        QUESTION: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    // Simple flat tree for replies (could be recursive for deep threading)
    const topLevelReplies = post.replies?.filter(r => !r.parent_reply_id) || [];
    const getChildReplies = (parentId: number) => post.replies?.filter(r => r.parent_reply_id === parentId) || [];

    return (
        <div className="space-y-6">
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-0 text-slate-500 hover:text-indigo-600"
            >
                ← Back to Community
            </Button>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                {post.is_pinned && (
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        Pinned
                    </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${typeColors[post.type]}`}>
                        {post.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight leading-tight">
                    {post.title}
                </h2>

                <div className="prose prose-slate max-w-none text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                </div>

                <div className="flex items-center gap-3 py-4 border-t border-slate-50">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center text-lg shadow-inner">
                        👤
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-800">{post.author_name || 'Anonymous Author'}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Author</div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Replies ({post.replies?.length || 0})</h3>
                    <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <ReplyForm onSubmit={(content) => onReply(content)} isSubmitting={isReplying} placeholder="Share your thoughts..." />
                </div>

                <div className="space-y-4">
                    {topLevelReplies.map(reply => (
                        <div key={reply.id} className="space-y-2">
                            <ReplyItem reply={reply} onReply={onReply} isReplying={isReplying} />
                            <div className="ml-8 space-y-2">
                                {getChildReplies(reply.id).map(child => (
                                    <ReplyItem key={child.id} reply={child} onReply={onReply} isReplying={isReplying} />
                                ))}
                            </div>
                        </div>
                    ))}

                    {post.replies?.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <p className="text-sm font-medium italic">No replies yet. Be the first to reply!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
