import React from 'react';

type Column<T> = {
    header: string;
    accessorKey?: keyof T;
    cell?: (info: { row: T }) => React.ReactNode;
};

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
}

export function Table<T>({ data, columns, isLoading, emptyMessage = "No data found" }: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full h-48 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg animate-pulse">
                <span className="text-slate-400 font-medium">Loading data...</span>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full py-12 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-lg border-dashed">
                <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <span className="text-slate-500 font-medium">{emptyMessage}</span>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-sm focus:outline-none">
                        {columns.map((col) => (
                            <th key={col.header} className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                            {columns.map((col) => (
                                <td key={col.header} className="px-6 py-4 text-sm text-slate-600 align-middle">
                                    {col.cell
                                        ? col.cell({ row })
                                        : col.accessorKey
                                            ? String(row[col.accessorKey])
                                            : null}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
