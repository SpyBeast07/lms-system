import React, { type InputHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FormError } from './FormError';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    register: UseFormRegisterReturn;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    error,
    register,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || register.name;

    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
                {label}
            </label>

            <input
                id={inputId}
                className={`
          w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 placeholder-slate-400
          transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
          ${error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                    }
        `}
                {...register}
                {...props}
            />
            <FormError error={error} />
        </div>
    );
};
