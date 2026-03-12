import { api } from '../../shared/api/axios';
import type { Notification } from './schemas';

export const notificationsApi = {
    getMyNotifications: async (): Promise<Notification[]> => {
        const response = await api.get('/notifications/');
        return response.data;
    },

    markAsRead: async (notificationId: number): Promise<Notification> => {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllAsRead: async (): Promise<void> => {
        await api.patch('/notifications/read-all');
    }
};
