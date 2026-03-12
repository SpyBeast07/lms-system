import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordData } from '../schemas';
import { useRequestPasswordChangeMutation } from '../hooks/useAuthMutations';
import { useToastStore } from '../../../app/store/toastStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requireEmail?: boolean;
}

export const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose, requireEmail }) => {

    const { addToast } = useToastStore();
    const mutation = useRequestPasswordChangeMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid }
    } = useForm<ChangePasswordData>({
        resolver: zodResolver(changePasswordSchema),
        mode: 'onChange'
    });

    if (!isOpen) return null;

    const onSubmit = async (data: ChangePasswordData) => {
        try {
            const res = await mutation.mutateAsync({ ...data, isPublic: requireEmail });
            addToast(res.detail || "Password change requested successfully", 'success');
            reset();
            onClose();
        } catch (error: any) {
            addToast(error?.response?.data?.detail || "Failed to request password change", 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-2xl">🔐</span> Change Password
                    </h2>
                    <button
                        onClick={() => { reset(); onClose(); }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    <p className="text-sm text-slate-500 mb-6">
                        For security reasons, your password change requires admin approval. You will be logged out once it is approved.
                    </p>

                    {requireEmail && (
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                id="email"
                                {...register('email')}
                                type="email"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder="Enter your email"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
                            )}
                        </div>
                    )}

                    <div>

                        <label htmlFor="current_password" className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <input
                            id="current_password"
                            {...register('current_password')}
                            type="password"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            placeholder="Enter current password"
                        />
                        {errors.current_password && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.current_password.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="new_password" className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input
                            id="new_password"
                            {...register('new_password')}
                            type="password"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            placeholder="Must be at least 8 characters"
                        />
                        {errors.new_password && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.new_password.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input
                            id="confirm_password"
                            {...register('confirm_password')}
                            type="password"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            placeholder="Re-enter new password"
                        />
                        {errors.confirm_password && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.confirm_password.message}</p>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => { reset(); onClose(); }}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || mutation.isPending}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                            {mutation.isPending ? 'Submitting...' : 'Request Change'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
