import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { TeacherSidebar } from './TeacherSidebar';
import { NotificationBell } from '../../notifications/components/NotificationBell';

export const TeacherLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <TeacherSidebar />
            <div className="flex-1 flex flex-col overflow-hidden ml-64">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
                    <h1 className="text-lg font-semibold text-slate-800">Teacher Portal</h1>
                    <NotificationBell />
                </header>
                <main className="flex-1 p-8 overflow-y-auto relative">
                    <div className="max-w-7xl mx-auto">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
        </div>
    );
};
