import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseCreateSchema, type CourseCreateData } from '../schemas';
import {
    useCoursesQuery,
    useCreateCourseMutation,
    useDeleteCourseMutation,
    useRestoreCourseMutation
} from '../hooks/useCourses';
import { FormInput } from '../../../shared/components/form/FormInput';
import { Button } from '../../../shared/components/Button';
import { Table } from '../../../shared/components/ui/Table';
import { Modal } from '../../../shared/components/ui/Modal';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';
import type { Course } from '../schemas';

export const CoursesPage: React.FC = () => {
    const { data: courses, isLoading, isError, error } = useCoursesQuery();
    const createMutation = useCreateCourseMutation();
    const deleteMutation = useDeleteCourseMutation();
    const restoreMutation = useRestoreCourseMutation();
    const { addToast } = useToastStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [courseToRestore, setCourseToRestore] = useState<string | null>(null);

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
                addToast(getErrorMessage(err, 'Failed to create course'), 'error');
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
                addToast(getErrorMessage(err, 'Failed to delete course'), 'error');
                setCourseToDelete(null);
            }
        });
    };

    const handleRestoreConfirm = () => {
        if (!courseToRestore) return;

        restoreMutation.mutate(courseToRestore, {
            onSuccess: () => {
                addToast('Course restored successfully.', 'success');
                setCourseToRestore(null);
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to restore course'), 'error');
                setCourseToRestore(null);
            }
        });
    };

    const activeCourses = courses?.filter(c => !c.is_deleted) || [];
    const deletedCourses = courses?.filter(c => c.is_deleted) || [];

    const activeColumns = [
        {
            header: 'Course Name', accessorKey: 'name' as keyof Course,
            cell: ({ row }: { row: Course }) => <span className="font-medium text-slate-800">{row.name}</span>
        },
        {
            header: 'Description', accessorKey: 'description' as keyof Course,
            cell: ({ row }: { row: Course }) => <div className="max-w-sm truncate">{row.description || '-'}</div>
        },

        {
            header: 'Actions',
            cell: ({ row }: { row: Course }) => (
                <div className="flex justify-start">
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

    const deletedColumns = [
        {
            header: 'Course Name', accessorKey: 'name' as keyof Course,
            cell: ({ row }: { row: Course }) => <span className="font-medium text-slate-500">{row.name}</span>
        },
        {
            header: 'Description', accessorKey: 'description' as keyof Course,
            cell: ({ row }: { row: Course }) => <div className="max-w-sm truncate text-slate-500">{row.description || '-'}</div>
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: Course }) => (
                <div className="flex justify-start">
                    <button
                        onClick={() => setCourseToRestore(row.id)}
                        className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-indigo-50"
                    >
                        Restore
                    </button>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="p-8 text-slate-500">Loading courses...</div>;
    if (isError) return <div className="p-8 text-red-500">Failed to load courses: {error?.message}</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Course Management</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                    Create Course
                </Button>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700">Active Courses</h2>
                <Table<Course>
                    data={activeCourses}
                    columns={activeColumns}
                    isLoading={isLoading}
                    emptyMessage="No active courses found."
                />
            </div>

            {deletedCourses.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700">Deleted Courses</h2>
                    <Table<Course>
                        data={deletedCourses}
                        columns={deletedColumns}
                        isLoading={false}
                        emptyMessage="No deleted courses found."
                    />
                </div>
            )}

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
                        label="Course Name"
                        type="text"
                        placeholder="Introduction to Programming"
                        register={register('name')}
                        error={errors.name?.message}
                    />
                    <FormInput
                        label="Description"
                        type="text"
                        placeholder="An engaging intro course."
                        register={register('description')}
                        error={errors.description?.message}
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

            <ConfirmDialog
                isOpen={courseToRestore !== null}
                title="Confirm Restoration"
                message="Are you sure you want to restore this course? It will become visible and active again."
                confirmText="Restore Course"
                variant="primary"
                isLoading={restoreMutation.isPending}
                onConfirm={handleRestoreConfirm}
                onCancel={() => setCourseToRestore(null)}
            />
        </div>
    );
};
