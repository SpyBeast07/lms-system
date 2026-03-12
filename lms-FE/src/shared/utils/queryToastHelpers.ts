import { useToastStore } from '../../app/store/toastStore';
import { getErrorMessage } from './error';

/**
 * Custom hook to easily trigger toasts from within React components.
 * Useful when you want manual control over when a toast appears.
 */
export const useToaster = () => {
    const { addToast } = useToastStore();

    return {
        success: (msg: string) => addToast(msg, 'success'),
        error: (err: any, defaultMsg?: string) => addToast(getErrorMessage(err, defaultMsg), 'error'),
        info: (msg: string) => addToast(msg, 'info'),
        warning: (msg: string) => addToast(msg, 'warning'),
    };
};

/**
 * Standard mutation callback helpers to reduce boilerplate.
 * Use these inside useMutation options.
 */
export const mutationToastHandlers = (
    successMessage: string,
    errorMessage?: string,
    onSuccess?: (data: any, variables: any, context: any) => void,
    onError?: (error: any, variables: any, context: any) => void
) => {
    const { addToast } = useToastStore.getState();

    return {
        onSuccess: (data: any, vars: any, ctx: any) => {
            addToast(successMessage, 'success');
            onSuccess?.(data, vars, ctx);
        },
        onError: (error: any, vars: any, ctx: any) => {
            addToast(getErrorMessage(error, errorMessage), 'error');
            onError?.(error, vars, ctx);
        }
    };
};
