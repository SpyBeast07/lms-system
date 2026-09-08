import { useEffect, useState } from 'react';
import { router } from '../../app/router';
import { useAuthStore } from '../../app/store/authStore';
import { DEMO_ROLES, type DemoRole } from './types';
import { useDemoStore } from './store';

const DEMO_ROLE_ORDER: DemoRole[] = ['super_admin', 'principal', 'teacher', 'student'];

type LandingTarget = 'login' | DemoRole;

const navigateTo = (target: LandingTarget) => {
    const route = target === 'super_admin' ? '/admin/dashboard' : target === 'principal' ? '/principal/dashboard' : target === 'teacher' ? '/teacher/courses' : '/student/courses';
    router.navigate({
        to: route as '/admin/dashboard' | '/principal/dashboard' | '/teacher/courses' | '/student/courses',
    });
};

export const DemoModeLayer: React.FC = () => {
    const { isAuthenticated } = useAuthStore();
    const { isDemoMode, demoRole, enterDemo, exitDemo } = useDemoStore();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Watchdog: if the demo session state gets cleared elsewhere (e.g. a "Secure
    // Logout" click inside a layout), fully exit demo mode and land back on login.
    useEffect(() => {
        if (isDemoMode && !isAuthenticated) {
            exitDemo();
            navigateTo('login');
        }
    }, [isDemoMode, isAuthenticated, exitDemo]);

    if (isDemoMode && demoRole) {
        const profile = DEMO_ROLES[demoRole];
        return (
            <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-lg ring-1 ring-white/20">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                        {profile.initials}
                    </span>
                    <span>Demo · {profile.label}</span>
                </div>
                <button
                    onClick={() => {
                        useAuthStore.getState().logout();
                        exitDemo();
                        navigateTo('login');
                    }}
                    className="rounded-full bg-rose-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg ring-1 ring-white/20 transition-colors hover:bg-rose-600"
                >
                    Exit demo
                </button>
            </div>
        );
    }

    if (isAuthenticated) {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsPickerOpen(true)}
                className="fixed bottom-4 right-4 z-40 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500"
            >
                Try Demo
            </button>

            {isPickerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
                    onClick={() => setIsPickerOpen(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Explore the platform</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Enter a read-only demo with pre-filled data. No account or backend required.
                            </p>
                        </div>

                        <div className="mb-4 flex flex-col gap-2">
                            {DEMO_ROLE_ORDER.map((role) => {
                                const profile = DEMO_ROLES[role];
                                return (
                                    <button
                                        key={role}
                                        onClick={() => {
                                            enterDemo(role);
                                            setIsPickerOpen(false);
                                            navigateTo(role);
                                        }}
                                        className="group flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white">
                                            {profile.initials}
                                        </span>
                                        <span>
                                            <span className="block text-sm font-semibold text-slate-900">
                                                {profile.label}
                                            </span>
                                            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                                                {profile.description}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setIsPickerOpen(false)}
                            className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};