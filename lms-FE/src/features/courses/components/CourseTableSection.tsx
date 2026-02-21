import React from 'react';
import { Table } from '../../../shared/components/ui/Table';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { Course } from '../schemas';

interface CourseTableSectionProps {
    title: string;
    courses: Course[];
    columns: any[];
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
    emptyMessage: string;
}

export const CourseTableSection: React.FC<CourseTableSectionProps> = ({
    title,
    courses,
    columns,
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    isLoading,
    emptyMessage,
}) => {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-700">{title}</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table<Course>
                    data={courses}
                    columns={columns}
                    emptyMessage={emptyMessage}
                />
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={onPageChange}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};
