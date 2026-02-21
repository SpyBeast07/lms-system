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
import { getErrorMessage } from '../../../shared/utils/error';
import { useGenerateAssignmentInst } from '../../ai/hooks';
import { Modal } from '../../../shared/components/ui/Modal';

export const AssignmentForm: React.FC = () => {
    const { data: courses, isLoading: isCoursesLoading } = useTeacherCourses();
    const createMutation = useCreateAssignmentMutation();
    const { addToast } = useToastStore();
    const generateAiMutation = useGenerateAssignmentInst();

    const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
    const [aiContext, setAiContext] = React.useState('');

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<AssignmentFormData & { description?: string }>({
        resolver: zodResolver(assignmentFormSchema),
        defaultValues: { max_attempts: 1 }
    });

    const onSubmit = (data: AssignmentFormData & { description?: string }) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                addToast('Assignment published successfully!', 'success');
                reset();
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to publish assignment'), 'error');
            }
        });
    };

    const handleGenerateAi = () => {
        if (!aiContext.trim()) {
            addToast('Please provide some context for the AI', 'error');
            return;
        }

        generateAiMutation.mutate(aiContext, {
            onSuccess: (generatedText) => {
                setValue('description', generatedText);
                setIsAiModalOpen(false);
                setAiContext('');
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Create New Assignment</h1>
                    <p className="text-sm text-slate-500 mt-1">Deploy automated assessments to your enrolled students.</p>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Instructions
                </Button>
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

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                            Instructions / Description
                        </label>
                        <textarea
                            id="description"
                            {...register('description')}
                            rows={4}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="Enter assignment instructions..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
                        )}
                    </div>

                    <FormSelect
                        label="Assign to Course"
                        register={register('course_id')}
                        options={[
                            { value: '', label: 'Select a course...' },
                            ...(((courses as any)?.items || []).map((c: any) => ({ value: c.id, label: c.name })) || [])
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
                        type="date"
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

            <Modal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                title="✨ AI Instructions Generator"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Provide a brief context or topic, and the AI will generate comprehensive assignment instructions.</p>
                    <textarea
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        rows={3}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        placeholder="e.g. Write an essay on the impact of artificial intelligence on modern healthcare..."
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="secondary" onClick={() => setIsAiModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleGenerateAi}
                            isLoading={generateAiMutation.isPending}
                        >
                            Generate
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};
