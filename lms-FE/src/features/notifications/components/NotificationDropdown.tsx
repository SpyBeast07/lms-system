import React from 'react';
import type { Notification } from '../schemas';
import { useMarkNotificationReadMutation } from '../hooks/useNotifications';

interface Props {
    notifications: Notification[];
    onClose: () => void;
    onMarkAllRead: () => void;
    isMarkingAll: boolean;
}

export const NotificationDropdown: React.FC<Props> = ({ notifications, onClose, onMarkAllRead, isMarkingAll }) => {
    const markReadMutation = useMarkNotificationReadMutation();

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        // In a real app, you might also route the user based on notification.type
    };

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden z-50 transform origin-top-right transition-all">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                <button
                    onClick={onMarkAllRead}
                    disabled={isMarkingAll || notifications.length === 0}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto w-full custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                        You have no notifications right now.
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <li
                                key={notification.id}
                                tabIndex={0}
                                onClick={() => handleNotificationClick(notification)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notification);
                                }}
                                className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 ${!notification.is_read ? 'bg-indigo-50/30' : ''
                                    }`}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 mt-1.5 bg-indigo-500 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(notification.created_at).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                        onClick={onClose}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};
