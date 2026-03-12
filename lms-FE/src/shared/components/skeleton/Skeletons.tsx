import React from 'react';

const SkeletonBase: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-slate-200 animate-pulse rounded ${className}`} />
);

export const SkeletonTable: React.FC<{ rows?: number, cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
                <SkeletonBase key={i} className="h-4 flex-1" />
            ))}
        </div>
        <div className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, ri) => (
                <div key={ri} className="p-4 flex gap-4 items-center">
                    {Array.from({ length: cols }).map((_, ci) => (
                        <SkeletonBase key={ci} className={`h-4 ${ci === 0 ? 'flex-[2]' : 'flex-1'}`} />
                    ))}
                </div>
            ))}
        </div>
    </div>
);



export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
    <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
                <SkeletonBase className="h-4 w-1/4" />
                <SkeletonBase className="h-10 w-full rounded-lg" />
            </div>
        ))}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <SkeletonBase className="h-10 w-24 rounded-lg" />
            <SkeletonBase className="h-10 w-32 rounded-lg" />
        </div>
    </div>
);
