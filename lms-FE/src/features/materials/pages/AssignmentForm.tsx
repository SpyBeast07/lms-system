import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentFormSchema, type AssignmentFormData } from '../schemas';
import { useCreateAssignmentMutation } from '../hooks/useMaterials';
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses';
import { FormInput } from '../../../shared/components/form/FormInput';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';

export const AssignmentForm: React.FC = () => {
    const { data: courses, isLoading: isCoursesLoading } = useTeacherCourses();
    const createMutation = useCreateAssignmentMutation();
    const { addToast } = useToastStore();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AssignmentFormData>({
        resolver: zodResolver(assignmentFormSchema),
        defaultValues: { max_attempts: 1 }
    });

    const onSubmit = (data: AssignmentFormData) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                addToast('Assignment published successfully!', 'success');
                reset();
            },
            onError: (err: any) => {
                addToast(err?.response?.data?.detail || err.message || 'Failed to publish assignment', 'error');
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Create New Assignment</h1>
                <p className="text-sm text-slate-500 mt-1">Deploy automated assessments to your enrolled students.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    <FormInput
                        label="Assignment Title"
                        type="text"
                        placeholder="Midterm Essay Submission"
                        register={register('title')}
                        error={errors.title?.message}
                    />

                    <FormSelect
                        label="Assign to Course"
                        register={register('course_id')}
                        options={[
                            { value: '', label: 'Select a course...' },
                            ...(courses?.map(c => ({ value: c.id, label: c.title })) || [])
                        ]}
                        error={errors.course_id?.message}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Total Marks"
                            type="number"
                            placeholder="100"
                            register={register('total_marks', { valueAsNumber: true })}
                            error={errors.total_marks?.message}
                        />

                        <FormInput
                            label="Max Attempts"
                            type="number"
                            placeholder="1"
                            register={register('max_attempts', { valueAsNumber: true })}
                            error={errors.max_attempts?.message}
                        />
                    </div>

                    <FormInput
                        label="Due Date"
                        type="datetime-local"
                        register={register('due_date')}
                        error={errors.due_date?.message}
                    />

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            isLoading={createMutation.isPending || isCoursesLoading}
                            disabled={createMutation.isPending || isCoursesLoading}
                        >
                            {createMutation.isPending ? 'Publishing...' : 'Publish Assignment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
