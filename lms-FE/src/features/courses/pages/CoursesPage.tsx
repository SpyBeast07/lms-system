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
import { Table } from '../../../shared/components/ui/Table';
import { Modal } from '../../../shared/components/ui/Modal';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { useToastStore } from '../../../app/store/toastStore';
import type { Course } from '../schemas';

export const CoursesPage: React.FC = () => {
    const { data: courses, isLoading, isError, error } = useCoursesQuery();
    const createMutation = useCreateCourseMutation();
    const deleteMutation = useDeleteCourseMutation();
    const { addToast } = useToastStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

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
                addToast('Course created successfully!', 'success');
                setIsCreateModalOpen(false);
                reset();
            },
            onError: (err: any) => {
                addToast(err?.response?.data?.detail || 'Failed to create course', 'error');
            }
        });
    };

    const handleDeleteConfirm = () => {
        if (!courseToDelete) return;

        deleteMutation.mutate(courseToDelete, {
            onSuccess: () => {
                addToast('Course deleted successfully.', 'success');
                setCourseToDelete(null);
            },
            onError: (err: any) => {
                addToast(err?.response?.data?.detail || 'Failed to delete course', 'error');
                setCourseToDelete(null);
            }
        });
    };

    const columns = [
        {
            header: 'Course Title', accessorKey: 'title' as keyof Course,
            cell: ({ row }: { row: Course }) => <span className="font-medium text-slate-800">{row.title}</span>
        },
        {
            header: 'Description', accessorKey: 'description' as keyof Course,
            cell: ({ row }: { row: Course }) => <div className="max-w-sm truncate">{row.description || '-'}</div>
        },
        {
            header: 'Status',
            cell: ({ row }: { row: Course }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {row.is_published ? 'Published' : 'Draft'}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: Course }) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => setCourseToDelete(row.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="p-8 text-slate-500">Loading courses...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load courses: {error?.message}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Course Management</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                    Create Course
                </Button>
            </div>

            <Table<Course>
                data={courses || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No courses found in the system."
            />

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    reset();
                }}
                title="Create New Course"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                reset();
                            }}
                            className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button type="submit" isLoading={createMutation.isPending}>
                            Create Course
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={courseToDelete !== null}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this course? All associated data will be removed."
                confirmText="Delete Course"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setCourseToDelete(null)}
            />
        </div>
    );
};
