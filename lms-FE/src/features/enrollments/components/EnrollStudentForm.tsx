import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enrollStudentSchema, type EnrollStudentData } from '../schemas';
import { useEnrollStudentMutation } from '../hooks/useEnrollments';
import { useUsersQuery } from '../../users/hooks/useUsers';
import { useCoursesQuery } from '../../courses/hooks/useCourses';
import { FormSelect } from '../../../shared/components/form/FormSelect';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../app/store/toastStore';
import { getErrorMessage } from '../../../shared/utils/error';

export const EnrollStudentForm: React.FC = () => {
    const { addToast } = useToastStore();
    const { data: users, isLoading: isLoadingUsers } = useUsersQuery();
    const { data: courses, isLoading: isLoadingCourses } = useCoursesQuery();
    const enrollStudentMutation = useEnrollStudentMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EnrollStudentData>({
        resolver: zodResolver(enrollStudentSchema),
    });

    const onSubmit = (data: EnrollStudentData) => {
        enrollStudentMutation.mutate(data, {
            onSuccess: () => {
                addToast('Student successfully enrolled in course', 'success');
                reset();
            },
            onError: (err: any) => {
                addToast(getErrorMessage(err, 'Failed to enroll student'), 'error');
            }
        });
    };

    const courseOptions = ((courses as any)?.items || []).map((c: any) => ({ value: c.id, label: c.name }));
    const studentOptions = ((users as any)?.items || []).filter((u: any) => u.role === 'student').map((s: any) => ({ value: s.id, label: `${s.name} (${s.email})` }));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormSelect
                label="Select Student"
                register={register('student_id')}
                options={[
                    { value: '', label: 'Choose a student...' },
                    ...studentOptions
                ]}
                error={errors.student_id?.message}
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
                <Button type="submit" isLoading={enrollStudentMutation.isPending || isLoadingUsers || isLoadingCourses} variant="primary">
                    Enroll Student
                </Button>
            </div>
        </form>
    );
};
