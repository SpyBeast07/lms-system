import { Controller } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { DatePicker } from '../ui/DatePicker';
import { FormError } from './FormError';

interface FormDatePickerProps<T extends FieldValues> {
    label: string;
    name: Path<T>;
    control: Control<T>;
    error?: string;
    required?: boolean;
    placeholder?: string;
}

export function FormDatePicker<T extends FieldValues>({
    label,
    name,
    control,
    error,
    required,
    placeholder
}: FormDatePickerProps<T>) {
    return (
        <div className="flex flex-col gap-1 w-full">
            <Controller
                name={name}
                control={control}
                render={({ field }: { field: any }) => (
                    <DatePicker
                        label={label}
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date) => {
                            field.onChange(date ? date.toISOString().split('T')[0] : '');
                        }}
                        placeholder={placeholder}
                        required={required}
                    />
                )}
            />
            <FormError error={error} />
        </div>
    );
}
