import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { StudentSidebar } from './StudentSidebar';

export const StudentLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <StudentSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-full">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
