import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../../../app/store/authStore';
import { ChangePasswordModal } from '../../auth/components/ChangePasswordModal';

export const PrincipalSidebar: React.FC = () => {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

    const navItems = [
        { path: '/principal/users', label: 'Users Management', icon: '👥' },
        { path: '/principal/courses', label: 'Courses Management', icon: '📚' },
        { path: '/principal/teacher-review', label: 'Teacher Review', icon: '👨‍🏫' },
        { path: '/principal/enrollments', label: 'Enrollments', icon: '🎓' },
        { path: '/principal/signup-requests', label: 'Signup Requests', icon: '📝' },
        { path: '/principal/password-requests', label: 'Password Requests', icon: '🔐' },
        { path: '/principal/activity-logs', label: 'Activity Logs', icon: '📋' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen overflow-y-auto flex-shrink-0">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white tracking-tight">LMS Principal</h2>
            </div>
            <nav className="flex-1 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`
                                        flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-indigo-600 text-white border-r-4 border-indigo-400'
                                            : 'hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
                <div className="space-y-2">
                    <button
                        onClick={() => setPasswordModalOpen(true)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600"
                    >
                        <span className="text-lg leading-none">🔐</span>
                        Change Password
                    </button>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
                <div className="text-xs text-slate-500 text-center">
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
