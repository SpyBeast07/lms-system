import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from '../../app/store/authStore';
import { queryClient } from '../../app/providers/QueryProvider';
import { createDemoTokens } from './demoToken';
import type { DemoRole } from './types';

interface DemoState {
    isDemoMode: boolean;
    demoRole: DemoRole | null;
    enterDemo: (role: DemoRole) => void;
    exitDemo: () => void;
}

export const useDemoStore = create<DemoState>()(
    persist(
        (set) => ({
            isDemoMode: false,
            demoRole: null,

            enterDemo: (role) => {
                // Bypass the real auth flow by installing a local, fake demo session.
                // No network calls are made; the mock adapter shields every request.
                useAuthStore.getState().login(createDemoTokens(role));
                queryClient.clear();
                set({ isDemoMode: true, demoRole: role });
            },

            exitDemo: () => {
                // Wipe the local demo session and return the app to its unauthenticated state.
                useAuthStore.getState().clearAuth();
                set({ isDemoMode: false, demoRole: null });
            },
        }),
        {
            name: 'demo-store',
            partialize: (state) => ({ isDemoMode: state.isDemoMode, demoRole: state.demoRole }),
        }
    )
);