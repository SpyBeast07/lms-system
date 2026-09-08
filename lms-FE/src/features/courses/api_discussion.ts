import { api } from '../../shared/api/axios';

export interface PostReply {
    id: number;
    post_id: number;
    author_id: number;
    parent_reply_id: number | null;
    content: string;
    created_at: string;
    author_name?: string;
}

export interface CoursePost {
    id: number;
    course_id: number;
    school_id: number;
    author_id: number;
    title: string;
    content: string;
    type: 'ANNOUNCEMENT' | 'DISCUSSION' | 'QUESTION';
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    author_name?: string; // Optional
    replies?: PostReply[];
}

export const discussionApi = {
    getPosts: async (courseId: string, type?: string) => {
        const params = type ? { post_type: type } : {};
        const response = await api.get<CoursePost[]>(`/courses/${courseId}/posts`, { params });
        return response.data;
    },
    getPost: async (postId: number) => {
        const response = await api.get<CoursePost>(`/posts/${postId}`);
        return response.data;
    },
    createPost: async (courseId: string, data: Partial<CoursePost>) => {
        const response = await api.post<CoursePost>(`/courses/${courseId}/posts`, data);
        return response.data;
    },
    createReply: async (postId: number, data: { content: string, parent_reply_id?: number }) => {
        const response = await api.post<PostReply>(`/posts/${postId}/reply`, data);
        return response.data;
    }
};
