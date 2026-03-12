import React from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { getButtonStyles, type ButtonVariant, type ButtonSize } from './ButtonStyles';

interface ButtonLinkProps extends LinkProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    className?: string;
}

export const ButtonLink: React.FC<ButtonLinkProps> = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    ...props
}) => {
    const styles = getButtonStyles(variant, size, fullWidth);

    return (
        <Link
            className={`${styles} ${className}`}
            {...props}
        >
            {children}
        </Link>
    );
};
