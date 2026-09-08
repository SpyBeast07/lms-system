import React from 'react';

interface DashboardSummaryProps {
    courseCount: number;
    materialCount: number;
    assignmentCount: number;
    isLoading?: boolean;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
    courseCount,
    materialCount,
    assignmentCount,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {['stat-1', 'stat-2', 'stat-3'].map(key => (
                    <div key={key} className="bg-white h-32 rounded-xl border border-slate-200"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Courses</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{courseCount}</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl">
                    🎓
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Curriculum Materials</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{materialCount}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl">
                    📚
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Assignments</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{assignmentCount}</h3>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl">
                    📝
                </div>
            </div>
        </div>
    );
};
