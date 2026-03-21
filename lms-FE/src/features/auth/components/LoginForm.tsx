import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { loginSchema, type LoginFormData } from '../schemas';
import { useLoginMutation } from '../hooks/useAuthMutations';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useState } from 'react';

export const LoginForm: React.FC = () => {
    // 1. Setup React Hook Form with Zod integration
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    });

    // 2. Setup TanStack Query Mutation
    const { mutate: performLogin, isPending, error: mutationError } = useLoginMutation();

    const searchParams = new URLSearchParams(window.location.search);
    const urlError = searchParams.get('error');

    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

    return (
        <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-200">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 shadow-sm border border-indigo-100">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h1>
                <p className="text-slate-500 mt-2 text-sm font-medium">Please enter your details to sign in.</p>
            </div>

            {mutationError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
                    {(mutationError as any)?.response?.data?.detail || "Invalid email or password"}
                </div>
            )}

            {urlError && (
                <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700 text-sm rounded-r-lg">
                    {urlError}
                </div>
            )}

            <form onSubmit={handleSubmit((data) => performLogin(data))} className="space-y-5">
                <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    register={register("email")}
                    error={errors.email?.message}
                />

                <FormInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    register={register("password")}
                    error={errors.password?.message}
                />

                <div className="pt-2">
                    <Button type="submit" fullWidth isLoading={isPending}>
                        Sign In
                    </Button>
                </div>

                <div className="relative flex items-center justify-center my-4">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-3 text-slate-400 text-xs absolute">Or continue with</span>
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => window.location.href = "/api/auth/google"}
                    className="flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </Button>
            </form>

            <div className="mt-6 text-center border-t border-slate-100 pt-6 space-y-2">
                <p className="text-slate-500 text-sm">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-500 transition-colors">
                        Request Access
                    </Link>
                </p>
                <p className="text-slate-500 text-sm">
                    Need to change your password?{' '}
                    <button
                        type="button"
                        onClick={() => setPasswordModalOpen(true)}
                        className="text-indigo-600 font-bold hover:text-indigo-500 transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                        Change Password
                    </button>
                </p>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                requireEmail={true}
            />
        </div>
    );
};
