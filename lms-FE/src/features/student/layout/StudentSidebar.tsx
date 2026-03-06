import React, { useState } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { useAuthStore } from '../../../app/store/authStore';
import { ChangePasswordModal } from '../../auth/components/ChangePasswordModal';
import { Button } from '../../../shared/components/Button';

export const StudentSidebar: React.FC = () => {
    const { logout } = useAuthStore();
    const router = useRouter();
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.navigate({ to: '/login' });
    };

    const navItems = [
        { path: '/student/courses', label: 'My Enrolled Courses', icon: '🎓' },
        { path: '/student/materials', label: 'Learning Materials', icon: '📖' },
        { path: '/student/submissions', label: 'My Submissions', icon: '📝' },
        { path: '/student/submissions/new', label: 'Submit Assignment', icon: '📤' },
    ];

    return (
        <aside className="w-64 bg-emerald-900 text-white h-screen flex flex-col fixed left-0 top-0 z-20 overflow-y-auto flex-shrink-0">
            <div className="p-6 border-b border-emerald-800 font-bold text-white tracking-tight flex items-center gap-2">
                <span className="text-xl">🧑‍🎓</span>
                <h2 className="text-xl">Student Portal</h2>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        activeOptions={{ exact: true }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-emerald-100 hover:bg-emerald-800 hover:text-white"
                        activeProps={{ className: 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500' }}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-emerald-800 space-y-2">
                <Button
                    variant="ghost"
                    onClick={() => setPasswordModalOpen(true)}
                    className="flex w-full !justify-start gap-3 px-4 py-3 text-sm font-medium text-emerald-100 rounded-xl hover:bg-emerald-800 hover:text-white transition-colors"
                >
                    <span className="text-lg">🔐</span>
                    Change Password
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="flex w-full !justify-start gap-3 px-4 py-3 text-sm font-medium text-red-300 rounded-xl hover:bg-red-500/10 hover:text-red-200 transition-colors"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Secure Logout
                </Button>
                <div className="text-xs text-emerald-400/60 text-center pt-2">
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
