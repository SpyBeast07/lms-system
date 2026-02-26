import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userCreateSchema, type UserCreateData } from '../schemas';
import { Modal } from '../../../shared/components/ui/Modal';
import { FormInput } from '../../../shared/components/form/FormInput';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { usePublicSchools } from '../../schools/hooks';

interface UserCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserCreateData) => void;
    isSubmitting: boolean;
    roleOptions: { value: string; label: string }[];
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    roleOptions,
}) => {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<UserCreateData>({
        resolver: zodResolver(userCreateSchema),
    });

    const selectedRole = watch('role');
    const showSchoolField = selectedRole === 'principal';

    const { data: schoolsData, isLoading: isLoadingSchools } = usePublicSchools();
    const schools = schoolsData?.items || [];

    const handleFormSubmit = (data: UserCreateData) => {
        onSubmit(data);
    };

    const handleClose = () => {
        onClose();
        reset();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New User"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
                    options={roleOptions}
                />

                {/* Conditional school selector — shown only when creating a principal */}
                {showSchoolField && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                            <span>Assign School</span>
                            {isLoadingSchools && (
                                <span className="text-xs text-indigo-500 animate-pulse">Loading schools…</span>
                            )}
                        </label>
                        <select
                            {...register('school_id', { valueAsNumber: true })}
                            disabled={isLoadingSchools}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                        >
                            <option value="">-- Select a school --</option>
                            {schools.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        {errors.school_id && (
                            <p className="text-red-500 text-xs mt-1">{errors.school_id.message as string}</p>
                        )}
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <Button type="submit" isLoading={isSubmitting}>
                        Create User
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
