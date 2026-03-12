import React from 'react';
import { useForm, useFieldArray, type Control, type UseFormRegister, type FieldErrors, type UseFormWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentFormSchema, type AssignmentFormData } from '../schemas';
import { useCreateAssignmentMutation } from '../hooks/useMaterials';
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses';
import { FormInput } from '../../../shared/components/form/FormInput';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { FormDatePicker } from '../../../shared/components/form/FormDatePicker';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';
import { useGenerateAssignmentInst } from '../../ai/hooks';
import { materialsApi } from '../api';
import { Modal } from '../../../shared/components/ui/Modal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';

// --- Question Builder Components ---

interface QuestionRowProps {
    control: Control<AssignmentFormData>;
    register: UseFormRegister<AssignmentFormData>;
    index: number;
    remove: (index: number) => void;
    watch: UseFormWatch<AssignmentFormData>;
    errors: FieldErrors<AssignmentFormData>;
}

const QuestionRow: React.FC<QuestionRowProps> = ({ control, register, index, remove, watch, errors }) => {
    const questionType = watch(`questions.${index}.question_type`);
    const { fields: options, append: appendOption, remove: removeOption, move: moveOption } = useFieldArray({
        control,
        name: `questions.${index}.options` as any
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEndOptions = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = options.findIndex((opt) => opt.id === active.id);
            const newIndex = options.findIndex((opt) => opt.id === over.id);
            moveOption(oldIndex, newIndex);
        }
    };

    return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 relative group">
            <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                    <FormInput
                        label={`Question ${index + 1}`}
                        register={register(`questions.${index}.question_text` as any)}
                        placeholder="Enter question text..."
                        error={(errors as any).questions?.[index]?.question_text?.message}
                    />
                </div>
                <div className="col-span-4">
                    <FormSelect
                        label="Type"
                        register={register(`questions.${index}.question_type` as any)}
                        options={[
                            { value: 'MCQ', label: 'Multiple Choice' },
                            { value: 'TEXT', label: 'Short Text' }
                        ]}
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                    <FormInput
                        label="Marks"
                        type="number"
                        register={register(`questions.${index}.marks` as any, { valueAsNumber: true })}
                        placeholder="5"
                    />
                </div>
                {/* order_index removed from UI as it's handled by index + 1 for simplicity here, but kept in schema */}
            </div>

            {questionType === 'MCQ' && (
                <div className="pl-4 border-l-2 border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-700">Options</label>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => appendOption({ option_text: '', is_correct: false })}
                            className="text-xs h-7 px-2"
                        >
                            + Add Option
                        </Button>
                    </div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndOptions}
                    >
                        <SortableContext
                            items={options.map(o => o.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {options.map((opt, optIndex) => (
                                    <SortableItem key={opt.id} id={opt.id} className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 w-full">
                                            <input
                                                type="checkbox"
                                                {...register(`questions.${index}.options.${optIndex}.is_correct` as any)}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    {...register(`questions.${index}.options.${optIndex}.option_text` as any)}
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    className="block w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeOption(optIndex)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
};

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
        control,
        watch,
        formState: { errors },
    } = useForm<AssignmentFormData>({
        resolver: zodResolver(assignmentFormSchema) as any,
        defaultValues: {
            max_attempts: 1,
            assignment_type: 'FILE_UPLOAD',
            total_marks: 0,
            questions: []
        }
    });

    const { fields: questions, append: appendQuestion, remove: removeQuestion, move: moveQuestion } = useFieldArray({
        control: control as any,
        name: "questions"
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEndQuestions = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q) => q.id === active.id);
            const newIndex = questions.findIndex((q) => q.id === over.id);
            moveQuestion(oldIndex, newIndex);
        }
    };

    const { fields: referenceMaterials, append: appendReference, remove: removeReference } = useFieldArray({
        control: control as any,
        name: "reference_materials"
    });

    const assignmentType = watch('assignment_type');

    const onSubmit = async (data: AssignmentFormData) => {
        // Validation: Ensure MCQ/TEXT assignments have at least one question
        if (data.assignment_type === 'MCQ' || data.assignment_type === 'TEXT') {
            if (!data.questions || data.questions.length === 0) {
                addToast('Please add at least one question', 'error');
                return;
            }
        }

        try {
            let finalData = { ...data };

            // Handle Reference Material Uploads for files
            const processedReferences: { type: 'file' | 'link', name: string, url: string }[] = [];
            for (const ref of finalData.reference_materials || []) {
                if (ref.type === 'file' && ref.file && ref.file.length > 0) {
                    const fileObj = ref.file[0];
                    const uploadRes = await materialsApi.uploadFile(fileObj);
                    processedReferences.push({
                        type: 'file',
                        name: ref.name,
                        url: uploadRes.file_url
                    });
                } else if (ref.type === 'link' && ref.url) {
                    processedReferences.push({
                        type: 'link',
                        name: ref.name,
                        url: ref.url
                    });
                }
            }
            finalData.reference_materials = processedReferences;

            // Map order_index for questions and options
            if (finalData.questions) {
                finalData.questions = finalData.questions.map((q, qIdx) => ({
                    ...q,
                    order_index: qIdx,
                    options: q.options?.map((opt, oIdx) => ({
                        ...opt,
                        order_index: oIdx
                    }))
                }));
            }

            createMutation.mutate(finalData, {
                onSuccess: () => {
                    addToast('Assignment published successfully!', 'success');
                    reset();
                },
                onError: (err: any) => {
                    addToast(getErrorMessage(err, 'Failed to publish assignment'), 'error');
                }
            });
        } catch (error) {
            console.error('Reference material processing failed:', error);
            addToast('Failed to process reference materials', 'error');
        }
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
        <div className="max-w-3xl mx-auto space-y-6">
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
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-8">
                            <FormInput
                                label="Assignment Title"
                                type="text"
                                placeholder="Midterm Essay Submission"
                                register={register('title')}
                                error={errors.title?.message}
                            />
                        </div>
                        <div className="col-span-4">
                            <FormSelect
                                label="Assignment Type"
                                register={register('assignment_type')}
                                options={[
                                    { value: 'FILE_UPLOAD', label: 'File Upload' },
                                    { value: 'MCQ', label: 'Multiple Choice' },
                                    { value: 'TEXT', label: 'Text Questions' }
                                ]}
                                error={errors.assignment_type?.message}
                            />
                        </div>
                    </div>

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

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-slate-700">
                                Reference Materials (Optional)
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => appendReference({ type: 'file', name: '', url: '' })}
                                className="flex items-center gap-2 text-xs py-1 px-3"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Material
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {referenceMaterials.map((field, idx) => (
                                <div key={field.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-4">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="w-1/3">
                                                <FormSelect
                                                    label="Type"
                                                    register={register(`reference_materials.${idx}.type` as any)}
                                                    options={[
                                                        { value: 'file', label: 'File Upload' },
                                                        { value: 'link', label: 'External Link' }
                                                    ]}
                                                />
                                            </div>
                                            <div className="w-2/3">
                                                <FormInput
                                                    label="Display Name"
                                                    type="text"
                                                    placeholder="E.g., Formula Sheet"
                                                    register={register(`reference_materials.${idx}.name` as any)}
                                                    error={(errors.reference_materials?.[idx] as any)?.name?.message}
                                                />
                                            </div>
                                        </div>

                                        {watch(`reference_materials.${idx}.type` as any) === 'link' ? (
                                            <FormInput
                                                label="URL"
                                                type="url"
                                                placeholder="https://example.com/resource"
                                                register={register(`reference_materials.${idx}.url` as any)}
                                                error={(errors.reference_materials?.[idx] as any)?.url?.message}
                                            />
                                        ) : (
                                            <div className="pt-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Upload File</label>
                                                <input
                                                    type="file"
                                                    {...register(`reference_materials.${idx}.file` as any)}
                                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeReference(idx)}
                                        className="text-slate-400 hover:text-rose-500 transition-colors p-2 mt-6"
                                        title="Remove Material"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {referenceMaterials.length === 0 && (
                                <div className="text-center py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
                                    <p className="text-sm text-slate-500">No reference materials added.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <FormSelect
                            label="Assign to Course"
                            register={register('course_id')}
                            options={[
                                { value: '', label: 'Select a course...' },
                                ...(((courses as any)?.items || []).map((c: any) => ({ value: c.id, label: c.name })) || [])
                            ]}
                            error={errors.course_id?.message}
                        />

                        <FormDatePicker
                            label="Due Date"
                            name="due_date"
                            control={control}
                            error={errors.due_date?.message}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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

                    {assignmentType !== 'FILE_UPLOAD' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-slate-800">Questionnaire</h3>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => appendQuestion({
                                        question_text: '',
                                        question_type: assignmentType === 'MCQ' ? 'MCQ' : 'TEXT',
                                        marks: 5,
                                        order_index: questions.length
                                    })}
                                    className="flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Question
                                </Button>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEndQuestions}
                            >
                                <SortableContext
                                    items={questions.map(q => q.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4">
                                        {questions.map((field, index) => (
                                            <SortableItem key={field.id} id={field.id}>
                                                <QuestionRow
                                                    index={index}
                                                    control={control}
                                                    register={register}
                                                    remove={removeQuestion}
                                                    watch={watch}
                                                    errors={errors}
                                                />
                                            </SortableItem>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {questions.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                                    <p className="text-slate-500">No questions added yet. Click "Add Question" to start.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-6 flex justify-end">
                        <Button
                            type="submit"
                            isLoading={createMutation.isPending || isCoursesLoading}
                            disabled={createMutation.isPending || isCoursesLoading}
                            className="px-8"
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
