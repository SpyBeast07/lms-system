import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    timerId?: ReturnType<typeof setTimeout>;
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    addToast: (message, type) => {
        const id = Math.random().toString(36).substring(2, 9);

        const timerId = setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }));
        }, 3000);

        set((state) => ({
            toasts: [...state.toasts, { id, message, type, timerId }]
        }));
    },

    removeToast: (id) => {
        set((state) => {
            const toast = state.toasts.find(t => t.id === id);
            if (toast?.timerId) {
                clearTimeout(toast.timerId);
            }
            return {
                toasts: state.toasts.filter((t) => t.id !== id)
            };
        });
    }
}));
