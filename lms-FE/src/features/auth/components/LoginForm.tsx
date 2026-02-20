import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas';
import { useLoginMutation } from '../hooks/useAuthMutations';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';

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

    return (
        <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-200">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    LMS Portal
                </h1>
                <p className="text-slate-500 mt-2 text-sm">Sign in to access your dashboard</p>
            </div>

            {mutationError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
                    {/* Extract HTTP exception detail if present, else fallback */}
                    {(mutationError as any)?.response?.data?.detail || "Invalid email or password"}
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
            </form>
        </div>
    );
};
