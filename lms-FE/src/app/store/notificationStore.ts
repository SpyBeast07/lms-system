import { create } from 'zustand';
import type { Notification } from '../../features/notifications/schemas';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;

    // Actions
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,

    setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => !n.is_read).length
    }),

    addNotification: (notification) => set((state) => {
        const newNotifications = [notification, ...state.notifications];
        return {
            notifications: newNotifications,
            unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
        };
    }),

    markAsRead: (id) => set((state) => {
        let changed = false;
        const mapped = state.notifications.map(n => {
            if (n.id === id && !n.is_read) {
                changed = true;
                return { ...n, is_read: true };
            }
            return n;
        });
        if (!changed) return state;
        return {
            notifications: mapped,
            unreadCount: Math.max(0, state.unreadCount - 1)
        };
    }),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
    })),

    clearAll: () => set({ notifications: [], unreadCount: 0 })
}));
