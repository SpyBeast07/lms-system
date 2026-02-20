import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../../../app/store/authStore';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const { logout } = useAuthStore();

    const navItems = [
        { path: '/admin/users', label: 'Users Management', icon: '👥' },
        { path: '/admin/courses', label: 'Courses Management', icon: '📚' },
        { path: '/admin/enrollments', label: 'Enrollments', icon: '🎓' },
        { path: '/admin/files', label: 'File Storage', icon: '🗄️' },
        { path: '/admin/health', label: 'System Health', icon: '🩺' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white tracking-tight">LMS Admin</h2>
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
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
                <div className="text-xs text-slate-500 text-center">
                    System v1.0.0
                </div>
            </div>
        </aside>
    );
};
