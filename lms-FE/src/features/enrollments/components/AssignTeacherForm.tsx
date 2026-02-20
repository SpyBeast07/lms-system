import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignTeacherSchema, type AssignTeacherData } from '../schemas';
import { useAssignTeacherMutation } from '../hooks/useEnrollments';
import { useUsersQuery } from '../../users/hooks/useUsers';
import { useCoursesQuery } from '../../courses/hooks/useCourses';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';

export const AssignTeacherForm: React.FC = () => {
    const { addToast } = useToastStore();
    const { data: users, isLoading: isLoadingUsers } = useUsersQuery();
    const { data: courses, isLoading: isLoadingCourses } = useCoursesQuery();
    const assignTeacherMutation = useAssignTeacherMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AssignTeacherData>({
        resolver: zodResolver(assignTeacherSchema),
    });

    const onSubmit = (data: AssignTeacherData) => {
        assignTeacherMutation.mutate(data, {
            onSuccess: () => {
                addToast('Teacher successfully assigned to course', 'success');
                reset();
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to assign teacher'), 'error');
            }
        });
    };

    const courseOptions = ((courses as any)?.items || []).map((c: any) => ({ value: c.id, label: c.name }));
    const teacherOptions = ((users as any)?.items || []).filter((u: any) => u.role === 'teacher').map((t: any) => ({ value: t.id, label: `${t.name} (${t.email})` }));

    // ... rest of the component

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormSelect
                label="Select Teacher"
                register={register('teacher_id')}
                options={[
                    { value: '', label: 'Choose a teacher...' },
                    ...teacherOptions
                ]}
                error={errors.teacher_id?.message}
            />

            <FormSelect
                label="Select Course"
                register={register('course_id')}
                options={[
                    { value: '', label: 'Choose a course...' },
                    ...courseOptions
                ]}
                error={errors.course_id?.message}
            />

            <div className="pt-4 flex justify-end">
                <Button type="submit" isLoading={assignTeacherMutation.isPending || isLoadingUsers || isLoadingCourses}>
                    Assign Teacher
                </Button>
            </div>
        </form>
    );
};
