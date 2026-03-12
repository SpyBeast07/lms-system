import React from 'react';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { CourseCreateData } from '../schemas';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Modal } from '../../../shared/components/ui/Modal';

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    onGenerateFullAi: () => void;
    isGeneratingAi: boolean;
    register: UseFormRegister<CourseCreateData>;
    errors: FieldErrors<CourseCreateData>;
    watch: UseFormWatch<CourseCreateData>;
    setValue: UseFormSetValue<CourseCreateData>;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    onGenerateFullAi,
    isGeneratingAi,
    register,
    errors,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Course"
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <FormInput
                    label="Course Name"
                    type="text"
                    placeholder="Introduction to Programming"
                    register={register('name')}
                    error={errors.name?.message}
                />

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                            Description
                        </label>
                        <button
                            type="button"
                            onClick={onGenerateFullAi}
                            disabled={isGeneratingAi}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 disabled:opacity-50 transition-colors bg-indigo-50 px-2.5 py-1 rounded-md"
                        >
                            {isGeneratingAi ? (
                                <span className="flex items-center gap-1.5">
                                    <svg className="animate-spin h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Context...
                                </span>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Generate with AI
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        id="description"
                        {...register('description')}
                        rows={5}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                        placeholder="Provide a topic or context, or leave blank to use the course name."
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
                    )}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Create Course
                    </button>
                </div>
            </form>
        </Modal>
    );
};
