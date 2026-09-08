import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionApi, type CoursePost } from '../api_discussion';
import { toast } from 'react-hot-toast';

export const useCoursePostsQuery = (courseId: string, type?: string) => {
    return useQuery({
        queryKey: ['course-posts', courseId, type],
        queryFn: () => discussionApi.getPosts(courseId, type),
        enabled: !!courseId
    });
};

export const usePostQuery = (postId: number) => {
    return useQuery({
        queryKey: ['post', postId],
        queryFn: () => discussionApi.getPost(postId),
        enabled: !!postId
    });
};

export const useCreatePostMutation = (courseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CoursePost>) => discussionApi.createPost(courseId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-posts', courseId] });
            toast.success('Post created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to create post');
        }
    });
};

export const useReplyMutation = (postId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { content: string, parent_reply_id?: number }) => discussionApi.createReply(postId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            toast.success('Reply added');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to add reply');
        }
    });
};
