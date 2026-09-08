import React from 'react';

interface FormErrorProps {
    error?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error }) => {
    if (!error) return null;

    return (
        <span className="text-xs font-medium text-red-500 mt-1">
            {error}
        </span>
    );
};
