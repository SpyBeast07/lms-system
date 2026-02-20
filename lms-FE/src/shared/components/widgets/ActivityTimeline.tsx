import React from 'react';

interface ActivityItem {
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    type: 'course' | 'material' | 'assignment' | 'system';
}

interface ActivityTimelineProps {
    activities: ActivityItem[];
    isLoading?: boolean;
}

const typeConfig = {
    course: { icon: '🎓', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    material: { icon: '📚', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    assignment: { icon: '📝', bg: 'bg-purple-100', text: 'text-purple-700' },
    system: { icon: '⚡️', bg: 'bg-slate-100', text: 'text-slate-700' }
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse h-64">
                <div className="h-4 w-1/4 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {['skeleton-1', 'skeleton-2', 'skeleton-3'].map(key => (
                        <div key={key} className="flex gap-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full rounded-tl-none relative shrink-0"></div>
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span>⏱️</span> Recent Global Activity
            </h2>

            {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                    No recent activity globally tracked.
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                    {activities.map((activity) => {
                        const config = typeConfig[activity.type] || typeConfig.system;

                        return (
                            <div key={activity.id} className="relative pl-8">
                                <div className={`absolute -left-5 top-0 w-10 h-10 ${config.bg} ${config.text} rounded-full flex items-center justify-center text-lg shadow-sm border-4 border-white`}>
                                    {config.icon}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-slate-800 text-sm">{activity.title}</h3>
                                    <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                                    <p className="text-xs text-slate-400 mt-1.5 font-medium">
                                        {activity.timestamp.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
