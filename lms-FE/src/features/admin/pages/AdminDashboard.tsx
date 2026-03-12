import React from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { decodeToken } from '../../../shared/utils/jwt';
import { DashboardSummary } from '../../../shared/components/widgets/DashboardSummary';
import { ActivityTimeline } from '../../../shared/components/widgets/ActivityTimeline';
import { useActivityLogsQuery } from '../../activityLogs/hooks/useActivityLogs';
import { useAdminStatsQuery } from '../../../shared/hooks/useStats';
import type { ActivityLog } from '../../activityLogs/schemas';

export const AdminDashboard: React.FC = () => {
    const { accessToken } = useAuthStore();
    const payload = decodeToken(accessToken);

    const userName = payload?.name || "Unknown User";
    const userRole = payload?.role || "Unknown Role";

    const { data: stats, isLoading: isLoadingStats } = useAdminStatsQuery();
    const { data: logsData, isLoading: isLoadingLogs } = useActivityLogsQuery({ page: 1, size: 5 });

    const activities = logsData?.items.map((log: ActivityLog) => ({
        id: log.id.toString(),
        title: log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: log.details || `Action performed by ${log.user?.name || 'System'}`,
        timestamp: new Date(log.created_at),
        type: (log.entity_type === 'course' ? 'course' :
            log.entity_type === 'material' ? 'material' :
                log.entity_type === 'submission' ? 'assignment' : 'system') as 'course' | 'material' | 'assignment' | 'system'
    })) || [];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Welcome to Admin Dashboard!</h1>
                <p className="text-slate-500 mt-2">
                    Hello, {userName}. You are logged in with role: <span className="font-semibold text-indigo-600">{userRole}</span>
                </p>
            </div>

            <DashboardSummary
                courseCount={stats?.courses || 0}
                materialCount={stats?.materials || 0}
                assignmentCount={stats?.assignments || 0}
                isLoading={isLoadingStats}
            />

            <div className="pt-4">
                <ActivityTimeline activities={activities} isLoading={isLoadingLogs} />
            </div>
        </div>
    );
};
