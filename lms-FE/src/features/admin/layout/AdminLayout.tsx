import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';

export const AdminLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm z-10">
                    <h1 className="text-lg font-semibold text-slate-800">Admin Dashboard</h1>
                </header>

                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
