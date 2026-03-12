import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api';
import { useNotificationStore } from '../../../app/store/notificationStore';
import { useToastStore } from '../../../app/store/toastStore';
import { useRef, useEffect } from 'react';

const NOTIFICATIONS_KEY = ['notifications'];

export const useNotificationsQuery = () => {
    const setNotifications = useNotificationStore(state => state.setNotifications);
    const { addToast } = useToastStore();
    const prevIdsRef = useRef<Set<number>>(new Set());

    const queryInfo = useQuery({
        queryKey: NOTIFICATIONS_KEY,
        queryFn: async () => {
            const data = await notificationsApi.getMyNotifications();
            setNotifications(data);
            return data;
        },
        // Polling could be enabled here for LMS real-time feel if WebSockets aren't used:
        refetchInterval: 15000 // Poll every 15s
    });

    useEffect(() => {
        if (queryInfo.data) {
            const currentIds = new Set(queryInfo.data.map((n: any) => n.id));

            // Only alert if we already had data (not first load), and we found new IDs
            if (prevIdsRef.current.size > 0) {
                const newNotifs = queryInfo.data.filter((n: any) => !prevIdsRef.current.has(n.id) && !n.is_read);
                if (newNotifs.length > 0) {
                    newNotifs.forEach((n: any) => addToast(n.message, 'info'));
                }
            }
            prevIdsRef.current = currentIds;
        }
    }, [queryInfo.data, addToast]);

    return queryInfo;
};

export const useMarkNotificationReadMutation = () => {
    const queryClient = useQueryClient();
    const markAsRead = useNotificationStore(state => state.markAsRead);

    return useMutation({
        mutationFn: (id: number) => notificationsApi.markAsRead(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
            // Optimistic update in Zustand store
            markAsRead(id);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        }
    });
};

export const useMarkAllNotificationsReadMutation = () => {
    const queryClient = useQueryClient();
    const markAllAsRead = useNotificationStore(state => state.markAllAsRead);

    return useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
            markAllAsRead();
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        }
    });
};
