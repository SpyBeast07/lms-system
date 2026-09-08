import React from 'react';
import { Button } from '../Button';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    isLoading = false
}) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100 sm:px-6 rounded-b-xl mt-4">
            <div className="flex justify-between flex-1 sm:hidden gap-2">
                <Button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    size="sm"
                >
                    Previous
                </Button>
                <Button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    variant="outline"
                    size="sm"
                >
                    Next
                </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
                        <span className="font-semibold text-slate-900">{totalItems}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex items-center gap-1.5" aria-label="Pagination">
                        <Button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1 || isLoading}
                            variant="ghost"
                            size="sm"
                            className="w-9 h-9 !p-0"
                        >
                            <span className="sr-only">Previous</span>
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </Button>

                        {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            // Basic pagination logic: show first, last, and a few around current
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <Button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        variant={currentPage === page ? 'primary' : 'ghost'}
                                        size="sm"
                                        className={`w-9 h-9 !p-0 ${currentPage === page ? 'shadow-md shadow-indigo-200' : ''}`}
                                    >
                                        {page}
                                    </Button>
                                );
                            }

                            if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                            ) {
                                return (
                                    <span key={page} className="px-2 text-slate-400 font-medium">
                                        ...
                                    </span>
                                );
                            }

                            return null;
                        })}

                        <Button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || isLoading}
                            variant="ghost"
                            size="sm"
                            className="w-9 h-9 !p-0"
                        >
                            <span className="sr-only">Next</span>
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </Button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

