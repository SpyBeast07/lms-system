import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';

export const Sidebar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: '/admin/users', label: 'Users Management', icon: '👥' },
        { path: '/admin/courses', label: 'Courses Management', icon: '📚' },
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
            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                System v1.0.0
            </div>
        </aside>
    );
};
