export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'indigo-ghost' | 'danger-outline' | 'success-outline' | 'warning' | 'warning-outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export const getButtonStyles = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', fullWidth = false) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale";

    const sizeStyles = {
        xs: "px-2.5 py-1 text-[10px] uppercase tracking-wider",
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
    };

    const widthStyles = fullWidth ? "w-full" : "";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow",
        secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:bg-red-700/90",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500",
        'indigo-ghost': "bg-transparent text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500",
        outline: "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
        'danger-outline': "bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 focus:ring-red-500",
        'success-outline': "bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 focus:ring-emerald-500",
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm",
        'warning-outline': "bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 focus:ring-amber-500",
    };

    return `${baseStyles} ${sizeStyles[size]} ${widthStyles} ${variants[variant]}`;
};
