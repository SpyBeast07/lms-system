import React from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';
import { DashboardSummary } from '../../../shared/components/widgets/DashboardSummary';
import { ActivityTimeline } from '../../../shared/components/widgets/ActivityTimeline';
import { useCoursesQuery } from '../../courses/hooks/useCourses';

export const AdminDashboard: React.FC = () => {
    const { accessToken } = useAuthStore();
    const payload = decodeToken(accessToken);

    const userName = payload?.name || "Unknown User";
    const userRole = payload?.role || "Unknown Role";

    const { data: courses, isLoading } = useCoursesQuery();

    const mockActivities = [
        { id: '1', title: 'New Course Published', description: 'Advanced Mathematics 101 has been published to the catalog.', timestamp: new Date(Date.now() - 3600000), type: 'course' as const },
        { id: '2', title: 'Teacher Assigned', description: 'Dr. Smith was assigned to Physics 201.', timestamp: new Date(Date.now() - 7200000), type: 'system' as const },
        { id: '3', title: 'System Backup', description: 'Nightly database snapshot successfully saved automatically.', timestamp: new Date(Date.now() - 86400000), type: 'system' as const },
        { id: '4', title: 'Maintenance Window', description: 'Server maintenance completed smoothly over weekend.', timestamp: new Date(Date.now() - 172800000), type: 'system' as const },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Welcome to Admin Dashboard!</h1>
                <p className="text-slate-500 mt-2">
                    Hello, {userName}. You are logged in with role: <span className="font-semibold text-indigo-600">{userRole}</span>
                </p>
            </div>

            <DashboardSummary
                courseCount={(courses as any)?.total || 0}
                materialCount={42} // Simulated metric based on database scale
                assignmentCount={18} // Simulated metric
                isLoading={isLoading}
            />

            <div className="pt-4">
                <ActivityTimeline activities={mockActivities} />
            </div>
        </div>
    );
};
