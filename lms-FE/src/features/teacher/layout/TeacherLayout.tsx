import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { TeacherSidebar } from './TeacherSidebar';

export const TeacherLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <TeacherSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-full">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
