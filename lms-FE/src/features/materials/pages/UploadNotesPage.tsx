import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { materialUploadFormSchema, type MaterialUploadFormData } from '../schemas';
import { useUploadNotes } from '../hooks/useUploadNotes';
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses';
import { FormInput } from '../../../shared/components/form/FormInput';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';

export const UploadNotesPage: React.FC = () => {
    const { data: courses, isLoading: isCoursesLoading } = useTeacherCourses();
    const uploadMutation = useUploadNotes();
    const { addToast } = useToastStore();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<MaterialUploadFormData>({
        resolver: zodResolver(materialUploadFormSchema),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSubmit = (data: MaterialUploadFormData) => {
        if (!selectedFile) {
            addToast('Please select a file to upload', 'error');
            return;
        }

        uploadMutation.mutate({
            file: selectedFile,
            title: data.title,
            course_id: data.course_id
        }, {
            onSuccess: () => {
                addToast('Material uploaded successfully!', 'success');
                reset();
                setSelectedFile(null);
                // Reset file input visually
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to upload material'), 'error');
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Upload Course Material</h1>
                <p className="text-sm text-slate-500 mt-1">Upload PDF notes, slides, or documents directly to your assigned courses.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    <FormInput
                        label="Material Title"
                        type="text"
                        placeholder="Week 1: Introduction Notes"
                        register={register('title')}
                        error={errors.title?.message}
                    />

                    <FormSelect
                        label="Assign to Course"
                        register={register('course_id')}
                        options={[
                            { value: '', label: 'Select a course...' },
                            ...(courses?.map(c => ({ value: c.id, label: c.name })) || [])
                        ]}
                        error={errors.course_id?.message}
                    />

                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 mb-1">
                            Document File
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-slate-600 justify-center">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PDF, PPTX, DOCX up to 50MB</p>
                            </div>
                        </div>
                        {selectedFile && (
                            <p className="text-sm text-emerald-600 mt-2 font-medium">Selected: {selectedFile.name}</p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            isLoading={uploadMutation.isPending || isCoursesLoading}
                            disabled={uploadMutation.isPending || isCoursesLoading}
                        >
                            {uploadMutation.isPending ? 'Uploading...' : 'Publish Material'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
