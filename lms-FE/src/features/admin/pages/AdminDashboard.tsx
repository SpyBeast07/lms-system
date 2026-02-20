import React from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';

export const AdminDashboard: React.FC = () => {
    const { accessToken } = useAuthStore();
    const payload = decodeToken(accessToken);

    const userName = payload?.name || "Unknown User";
    const userRole = payload?.role || "Unknown Role";

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Welcome to Admin Dashboard!</h1>
                <p className="text-slate-500 mt-2">
                    Hello, {userName}. You are logged in with role: <span className="font-semibold text-indigo-600">{userRole}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-700">Quick Stats</h3>
                    <p className="text-slate-500 mt-2">Dashboard metrics will appear here.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-700">Recent Activity</h3>
                    <p className="text-slate-500 mt-2">System logs will appear here.</p>
                </div>
            </div>
        </div>
    );
};
