import React, { type SelectHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FormError } from './FormError';

interface FormSelectOption {
    value: string;
    label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: FormSelectOption[];
    register: UseFormRegisterReturn;
    error?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    options,
    register,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-sm font-medium text-slate-700">
                {label}
            </label>
            <select
                {...register}
                {...props}
                className={`
                    w-full px-4 py-2 bg-white border rounded-lg outline-none transition-colors
                    focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                    disabled:opacity-50 disabled:bg-slate-50
                    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 hover:border-slate-400'}
                `}
            >
                {/* Default Empty Option matching standard patterns */}
                <option value="" disabled>Select an option</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <FormError error={error} />
        </div>
    );
};
