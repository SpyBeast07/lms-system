import React, { useState, useRef, useEffect } from 'react';
import { useNotificationsQuery, useMarkAllNotificationsReadMutation } from '../hooks/useNotifications';
import { useNotificationStore } from '../../../app/store/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // This ensures data is fetched and put into our Zustand store
    useNotificationsQuery();
    const markAllMutation = useMarkAllNotificationsReadMutation();

    // We read UI state from Zustand
    const { notifications, unreadCount } = useNotificationStore();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleMarkAllRead = () => {
        markAllMutation.mutate();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setIsOpen(false)}
                    onMarkAllRead={handleMarkAllRead}
                    isMarkingAll={markAllMutation.isPending}
                />
            )}
        </div>
    );
};
