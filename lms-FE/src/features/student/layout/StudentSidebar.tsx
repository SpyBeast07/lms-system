import React from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { useAuthStore } from '../../../app/store/authStore';

export const StudentSidebar: React.FC = () => {
    const { logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.navigate({ to: '/login' });
    };

    const navItems = [
        { path: '/student/courses', label: 'My Enrolled Courses', icon: '🎓' },
        { path: '/student/materials', label: 'Learning Materials', icon: '📖' },
        { path: '/student/submissions', label: 'Submit Assignments', icon: '📤' },
    ];

    return (
        <aside className="w-64 bg-emerald-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
            <div className="p-6">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    🧑‍🎓 Student Portal
                </h2>
                <p className="text-xs text-emerald-200 mt-1">Enterprise Education LMS</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-emerald-100 hover:bg-emerald-800 hover:text-white"
                        activeProps={{ className: 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500' }}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-emerald-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-200 rounded-xl hover:bg-red-500/80 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Secure Logout
                </button>
            </div>
        </aside>
    );
};
