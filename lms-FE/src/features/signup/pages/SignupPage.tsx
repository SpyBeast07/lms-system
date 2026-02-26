import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { signupSchema, type SignupFormData } from '../schemas';
import { useSubmitSignupMutation } from '../hooks';
import { useToastStore } from '../../../app/store/toastStore';
import { usePublicSchools } from '../../schools/hooks';

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToastStore();
    const submitSignup = useSubmitSignupMutation();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: { requested_role: 'student' },
    });

    const role = watch('requested_role');
    const { data: schoolsData, isLoading: isLoadingSchools } = usePublicSchools();
    const schools = schoolsData?.items || [];

    const onSubmit = async (data: SignupFormData) => {
        try {
            await submitSignup.mutateAsync(data);
            addToast(
                'Signup request submitted. Please await admin approval before logging in.',
                'success'
            );
            navigate({ to: '/login' });
        } catch (error: any) {
            const message =
                error?.response?.data?.detail ||
                'Something went wrong. Please try again.';
            addToast(message, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-indigo-500/30">
                        🎓
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Create Account</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Request access to the LMS platform. An admin will review your application.
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="signup-name" className="block text-sm font-semibold text-slate-300 mb-1.5">Full Name</label>
                            <input
                                {...register('name')}
                                id="signup-name"
                                type="text"
                                placeholder="Jane Smith"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            {errors.name && (
                                <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-300 mb-1.5">Email Address</label>
                            <input
                                {...register('email')}
                                id="signup-email"
                                type="email"
                                placeholder="jane@example.com"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            {errors.email && (
                                <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="signup-password" className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                            <input
                                {...register('password')}
                                id="signup-password"
                                type="password"
                                placeholder="Min. 6 characters"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            {errors.password && (
                                <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label htmlFor="signup-role" className="block text-sm font-semibold text-slate-300 mb-1.5">Requested Role</label>
                            <select
                                {...register('requested_role')}
                                id="signup-role"
                                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher / Instructor</option>
                                <option value="principal">Principal</option>
                            </select>
                            {errors.requested_role && (
                                <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.requested_role.message}</p>
                            )}
                        </div>

                        {/* School Dropdown (Conditional) */}
                        {role === 'principal' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label htmlFor="signup-school" className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                                    <span>Select School</span>
                                    {isLoadingSchools && <span className="text-xs text-indigo-400 animate-pulse">Loading schools...</span>}
                                </label>
                                <select
                                    {...register('school_id', { valueAsNumber: true })}
                                    id="signup-school"
                                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                                    disabled={isLoadingSchools}
                                >
                                    <option value="">-- Choose your school --</option>
                                    {schools.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {errors.school_id && (
                                    <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.school_id.message}</p>
                                )}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || submitSignup.isPending}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-600 text-white font-black rounded-xl transition-all duration-200 text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                            >
                                {(isSubmitting || submitSignup.isPending) ? 'Submitting Request...' : 'Submit Signup Request'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-amber-300 text-xs text-center font-medium leading-relaxed">
                            ⏳ Your request will be reviewed by an administrator. You'll be able to log in once approved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
