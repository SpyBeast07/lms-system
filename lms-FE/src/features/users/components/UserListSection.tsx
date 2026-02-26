import React from 'react';
import { Table } from '../../../shared/components/ui/Table';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { User } from '../schemas';

interface UserListSectionProps {
    title: string;
    users: User[];
    columns: any[];
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
    emptyMessage: string;
}

export const UserListSection: React.FC<UserListSectionProps> = ({
    title,
    users,
    columns,
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    isLoading,
    emptyMessage,
}) => {
    if (totalItems === 0 && users.length === 0 && !isLoading) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-700">{title}</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table<User>
                    data={users}
                    columns={columns}
                    isLoading={false}
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
