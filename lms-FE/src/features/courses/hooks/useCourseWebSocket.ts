import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../app/store/authStore';

export const useCourseWebSocket = (courseId: string | null) => {
    const queryClient = useQueryClient();
    const token = useAuthStore(state => state.accessToken);

    useEffect(() => {
        if (!courseId || !token) return;

        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        
        let wsUrl = '';
        if (baseUrl.startsWith('http')) {
            wsUrl = baseUrl.replace(/^http/, 'ws');
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${window.location.host}${baseUrl}`;
        }
        
        const ws = new WebSocket(`${wsUrl}/courses/${courseId}/ws?token=${token}`);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.event === 'new_post') {
                    // Prepend to all filters that match
                    const updateCacheForFilter = (filterType: string | undefined) => {
                        queryClient.setQueryData(['course-posts', courseId, filterType], (oldData: any) => {
                            if (!oldData) return [message.data];
                            // Avoid duplicates
                            if (oldData.some((post: any) => post.id === message.data.id)) return oldData;
                            return [message.data, ...oldData];
                        });
                    };
                    
                    updateCacheForFilter(undefined); // All posts
                    if (message.data.type) {
                        updateCacheForFilter(message.data.type); // Specific type filter
                    }

                } else if (message.event === 'new_reply') {
                    const replyData = message.data;
                    queryClient.setQueryData(['post', replyData.post_id], (oldPost: any) => {
                        if (!oldPost) return oldPost;
                        // Avoid duplicates
                        const exists = oldPost.replies?.some((r: any) => r.id === replyData.id);
                        if (exists) return oldPost;
                        
                        const newReplies = [...(oldPost.replies || []), replyData];
                        return { ...oldPost, replies: newReplies };
                    });
                }
            } catch (err) {
                console.error("WebSocket message parsing error:", err);
            }
        };

        return () => {
            ws.close();
        };
    }, [courseId, token, queryClient]);
};
