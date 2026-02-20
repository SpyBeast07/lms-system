import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentSubmissionSchema, type AssignmentSubmissionData } from '../schemas';
import { FormInput } from '../../../shared/components/form/FormInput';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';

export const AssignmentSubmissionPage: React.FC = () => {
    const { addToast } = useToastStore();
    const { data: courses } = useStudentCourses();

    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const { data: materials, isLoading: isMaterialsLoading } = useCourseMaterialsQuery(selectedCourse);

    const assignments = materials?.filter((m: any) => !m.file_url) || [];
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AssignmentSubmissionData>({
        resolver: zodResolver(assignmentSubmissionSchema),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: AssignmentSubmissionData) => {
        if (!selectedFile) {
            addToast('Please attach your assignment file', 'error');
            return;
        }

        // Placeholder for future backend integration natively
        console.log('Simulating submission payload natively:', {
            assignment_id: data.assignment_id,
            comments: data.comments,
            file: selectedFile.name,
            size: selectedFile.size
        });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        addToast('Assignment submitted successfully! (Mock)', 'success');
        reset();
        setSelectedFile(null);
        setSelectedCourse('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Submit Assignment</h1>
                <p className="text-sm text-slate-500 mt-1">Upload your completed work securely for instructor review.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    <div>
                        <label htmlFor="course-select" className="block text-sm font-medium text-slate-700 mb-1">Select Course Filter</label>
                        <select
                            id="course-select"
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 bg-white border"
                        >
                            <option value="">Choose a course first...</option>
                            {courses?.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <FormSelect
                        label="Select Assignment"
                        register={register('assignment_id')}
                        options={[
                            { value: '', label: 'Select pending assignment...' },
                            ...(assignments.map((a: any) => ({ value: a.id, label: a.title })) || [])
                        ]}
                        error={errors.assignment_id?.message}
                        disabled={!selectedCourse || isMaterialsLoading}
                    />

                    <FormInput
                        label="Submission Comments (Optional)"
                        type="text"
                        placeholder="Any notes for your instructor..."
                        register={register('comments')}
                        error={errors.comments?.message}
                    />

                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 mb-1">
                            Submission File
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-slate-600 justify-center">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                        <span>Upload your work</span>
                                        <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PDF, ZIP, DOCX up to 10MB</p>
                            </div>
                        </div>
                        {selectedFile && (
                            <p className="text-sm text-emerald-600 mt-2 font-medium">Selected: {selectedFile.name}</p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            disabled={isSubmitting || !selectedCourse}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
