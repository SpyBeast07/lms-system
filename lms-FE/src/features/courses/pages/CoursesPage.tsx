import React, { useState, useReducer } from 'react';
import { Link } from '@tanstack/react-router';
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
import { SkeletonTable } from '../../../shared/components/skeleton/Skeletons';
import { mutationToastHandlers } from '../../../shared/utils/queryToastHelpers';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { Course } from '../schemas';

type UiState = {
    isCreateModalOpen: boolean;
    courseToDelete: string | null;
    courseToRestore: string | null;
};

type UiAction =
    | { type: 'OPEN_CREATE' }
    | { type: 'CLOSE_CREATE' }
    | { type: 'SET_DELETE'; id: string | null }
    | { type: 'SET_RESTORE'; id: string | null };

const uiReducer = (state: UiState, action: UiAction): UiState => {
    switch (action.type) {
        case 'OPEN_CREATE': return { ...state, isCreateModalOpen: true };
        case 'CLOSE_CREATE': return { ...state, isCreateModalOpen: false };
        case 'SET_DELETE': return { ...state, courseToDelete: action.id };
        case 'SET_RESTORE': return { ...state, courseToRestore: action.id };
        default: return state;
    }
};

export const CoursesPage: React.FC = () => {
    const [activePage, setActivePage] = useState(1);
    const [deletedPage, setDeletedPage] = useState(1);
    const limit = 10;
    const activeQuery = useCoursesQuery(activePage, limit, false);
    const deletedQuery = useCoursesQuery(deletedPage, limit, true);
    const createMutation = useCreateCourseMutation();
    const deleteMutation = useDeleteCourseMutation();
    const restoreMutation = useRestoreCourseMutation();

    const [ui, dispatch] = useReducer(uiReducer, {
        isCreateModalOpen: false,
        courseToDelete: null,
        courseToRestore: null,
    });
    const { isCreateModalOpen, courseToDelete, courseToRestore } = ui;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CourseCreateData>({
        resolver: zodResolver(courseCreateSchema),
    });

    const onSubmit = (data: CourseCreateData) => {
        createMutation.mutate(data, mutationToastHandlers(
            'Course created successfully!',
            undefined,
            () => {
                dispatch({ type: 'CLOSE_CREATE' });
                reset();
            }
        ));
    };

    const handleDeleteConfirm = () => {
        if (!courseToDelete) return;

        deleteMutation.mutate(courseToDelete, mutationToastHandlers(
            'Course deleted successfully.',
            undefined,
            () => dispatch({ type: 'SET_DELETE', id: null }),
            () => dispatch({ type: 'SET_DELETE', id: null })
        ));
    };

    const handleRestoreConfirm = () => {
        if (!courseToRestore) return;

        restoreMutation.mutate(courseToRestore, mutationToastHandlers(
            'Course restored successfully.',
            undefined,
            () => dispatch({ type: 'SET_RESTORE', id: null }),
            () => dispatch({ type: 'SET_RESTORE', id: null })
        ));
    };

    const activeCourses: Course[] = (activeQuery.data as any)?.items || [];
    const deletedCourses: Course[] = (deletedQuery.data as any)?.items || [];

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
                <div className="flex justify-start gap-4">
                    <Link
                        to="/admin/courses/$courseId"
                        params={{ courseId: row.id }}
                        className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-indigo-50"
                    >
                        View
                    </Link>
                    <button
                        onClick={() => dispatch({ type: 'SET_DELETE', id: row.id })}
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
                        onClick={() => dispatch({ type: 'SET_RESTORE', id: row.id })}
                        className="text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors px-3 py-1 rounded-md hover:bg-indigo-50"
                    >
                        Restore
                    </button>
                </div>
            )
        }
    ];

    if (activeQuery.isLoading || deletedQuery.isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
                    <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-lg"></div>
                </div>
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-slate-200 animate-pulse rounded"></div>
                    <SkeletonTable rows={5} cols={3} />
                </div>
            </div>
        );
    }
    if (activeQuery.isError || deletedQuery.isError) {
        return (
            <div className="p-8 text-red-500">
                Failed to load courses: {activeQuery.error?.message || deletedQuery.error?.message}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Course Management</h1>
                <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })} variant="primary">
                    Create Course
                </Button>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700">Active Courses</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <Table<Course>
                        data={activeCourses}
                        columns={activeColumns}
                        emptyMessage="No active courses found."
                    />
                    <Pagination
                        currentPage={activePage}
                        totalItems={(activeQuery.data as any)?.total || 0}
                        pageSize={limit}
                        onPageChange={setActivePage}
                        isLoading={activeQuery.isLoading}
                    />
                </div>
            </div>

            {((deletedQuery.data as any)?.total > 0 || deletedCourses.length > 0) && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700">Deleted Courses</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <Table<Course>
                            data={deletedCourses}
                            columns={deletedColumns}
                            emptyMessage="No deleted courses found."
                        />
                        <Pagination
                            currentPage={deletedPage}
                            totalItems={(deletedQuery.data as any)?.total || 0}
                            pageSize={limit}
                            onPageChange={setDeletedPage}
                            isLoading={deletedQuery.isLoading}
                        />
                    </div>
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    dispatch({ type: 'CLOSE_CREATE' });
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
                                dispatch({ type: 'CLOSE_CREATE' });
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
                onCancel={() => dispatch({ type: 'SET_DELETE', id: null })}
            />

            <ConfirmDialog
                isOpen={courseToRestore !== null}
                title="Confirm Restoration"
                message="Are you sure you want to restore this course? It will become visible and active again."
                confirmText="Restore Course"
                variant="primary"
                isLoading={restoreMutation.isPending}
                onConfirm={handleRestoreConfirm}
                onCancel={() => dispatch({ type: 'SET_RESTORE', id: null })}
            />
        </div>
    );
};
