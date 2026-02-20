import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseCreateSchema, type CourseCreateData } from '../schemas';
import {
    useCoursesQuery,
    useCreateCourseMutation,
    useDeleteCourseMutation
} from '../hooks/useCourses';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';

export const CoursesPage: React.FC = () => {
    const { data: courses, isLoading, isError, error } = useCoursesQuery();
    const createMutation = useCreateCourseMutation();
    const deleteMutation = useDeleteCourseMutation();

    const [isCreating, setIsCreating] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CourseCreateData>({
        resolver: zodResolver(courseCreateSchema),
    });

    const onSubmit = (data: CourseCreateData) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            }
        });
    };

    if (isLoading) return <div className="p-8 text-slate-500">Loading courses...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load courses: {error?.message}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Course Management</h1>
                <Button onClick={() => setIsCreating(!isCreating)} variant="primary">
                    {isCreating ? 'Cancel' : 'Create Course'}
                </Button>
            </div>

            {/* Create Inline Form */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <h2 className="text-lg font-bold mb-4">Create New Course</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
                        <FormInput
                            label="Course Title"
                            type="text"
                            placeholder="Introduction to Programming"
                            register={register('title')}
                            error={errors.title?.message}
                        />
                        <FormInput
                            label="Description"
                            type="text"
                            placeholder="An engaging intro course."
                            register={register('description')}
                            error={errors.description?.message}
                        />
                        <FormInput
                            label="Instructor ID"
                            type="text"
                            placeholder="UUID string"
                            register={register('instructor_id')}
                            error={errors.instructor_id?.message}
                        />
                        <div className="pt-2 flex justify-end">
                            <Button type="submit" isLoading={createMutation.isPending}>
                                Create Course
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Courses Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Course Title</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses?.map((course) => (
                            <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{course.title}</td>
                                <td className="px-6 py-4 max-w-sm truncate">{course.description || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {course.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete this course permanently?')) {
                                                deleteMutation.mutate(course.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {courses?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    No courses found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
