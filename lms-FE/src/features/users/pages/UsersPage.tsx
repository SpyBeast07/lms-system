import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userCreateSchema, type UserCreateData } from '../schemas';
import {
    useUsersQuery,
    useCreateUserMutation,
    useDeleteUserMutation
} from '../hooks/useUsers';
import { FormInput } from '../../../shared/components/form/FormInput';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';

export const UsersPage: React.FC = () => {
    const { data: users, isLoading, isError, error } = useUsersQuery();
    const createMutation = useCreateUserMutation();
    const deleteMutation = useDeleteUserMutation();

    const [isCreating, setIsCreating] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserCreateData>({
        resolver: zodResolver(userCreateSchema),
    });

    const onSubmit = (data: UserCreateData) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            }
        });
    };

    if (isLoading) return <div className="p-8 text-slate-500">Loading users...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load users: {error?.message}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                <Button onClick={() => setIsCreating(!isCreating)} variant="primary">
                    {isCreating ? 'Cancel' : 'Create User'}
                </Button>
            </div>

            {/* Create Modal / Inline Form */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <h2 className="text-lg font-bold mb-4">Create New User</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
                        <FormInput
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            register={register('name')}
                            error={errors.name?.message}
                        />
                        <FormInput
                            label="Email Address"
                            type="email"
                            placeholder="john@example.com"
                            register={register('email')}
                            error={errors.email?.message}
                        />
                        <FormInput
                            label="Temporary Password"
                            type="password"
                            placeholder="••••••••"
                            register={register('password')}
                            error={errors.password?.message}
                        />
                        <FormSelect
                            label="Role"
                            register={register('role')}
                            error={errors.role?.message}
                            options={[
                                { value: 'super_admin', label: 'Super Admin' },
                                { value: 'teacher', label: 'Teacher' },
                                { value: 'student', label: 'Student' }
                            ]}
                        />
                        <div className="pt-2 flex justify-end">
                            <Button type="submit" isLoading={createMutation.isPending}>
                                Create User
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((user) => (
                            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this user?')) {
                                                deleteMutation.mutate(user.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
