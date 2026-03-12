import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../../../app/store/authStore';
import { ChangePasswordModal } from '../../auth/components/ChangePasswordModal';
import { Button } from '../../../shared/components/Button';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

    const navItems = [
        { path: '/admin/users', label: 'Users Management', icon: '👥' },
        { path: '/admin/schools', label: 'Schools Management', icon: '🏢' },
        { path: '/admin/signup-requests', label: 'Signup Requests', icon: '📝' },
        { path: '/admin/password-requests', label: 'Password Requests', icon: '🔐' },
        { path: '/admin/activity-logs', label: 'Activity Logs', icon: '📋' },
        { path: '/admin/health', label: 'System Health', icon: '🩺' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen overflow-y-auto flex-shrink-0">
            <div className="p-6 border-b border-slate-700 font-bold text-white tracking-tight flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h2 className="text-xl">LMS Admin</h2>
            </div>
            <nav className="flex-1 py-4 px-2">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                                            : 'hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setPasswordModalOpen(true)}
                    className="flex w-full !justify-start gap-3 px-4 py-3 text-sm font-medium text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <span className="text-lg">🔐</span>
                    Change Password
                </Button>
                <Button
                    variant="ghost"
                    onClick={logout}
                    className="flex w-full !justify-start gap-3 px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Secure Logout
                </Button>
                <div className="text-xs text-slate-500 text-center pt-2">
                    System v1.0.0
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
            />
        </aside>
    );
};
