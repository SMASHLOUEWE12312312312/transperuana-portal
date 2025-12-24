'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Inbox } from 'lucide-react';

export interface Column<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    width?: string;
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    loading?: boolean;
    emptyState?: {
        icon?: React.ReactNode;
        title: string;
        description: string;
        action?: { label: string; onClick: () => void };
    };
    onRowClick?: (row: T) => void;
    rowKey: keyof T;
}

export function DataTable<T extends object>({
    data,
    columns,
    pageSize = 10,
    loading = false,
    emptyState,
    onRowClick,
    rowKey
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 when filtered data shrinks below current page
    const dataLength = data.length;
    if (currentPage > Math.ceil(dataLength / pageSize) && dataLength > 0) {
        setCurrentPage(1);
    }

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortKey) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortKey as keyof T];
            const bVal = b[sortKey as keyof T];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            let comparison = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                comparison = aVal.localeCompare(bVal);
            } else if (aVal instanceof Date && bVal instanceof Date) {
                comparison = aVal.getTime() - bVal.getTime();
            } else {
                comparison = aVal < bVal ? -1 : 1;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortKey, sortDirection]);

    // Paginate data
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const getValue = (row: T, key: string): unknown => {
        if (key.includes('.')) {
            return key.split('.').reduce((obj: unknown, k) => {
                return obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[k] : undefined;
            }, row);
        }
        return row[key as keyof T];
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={String(col.key)} style={{ width: col.width }}>
                                    <div className="h-4 w-20 skeleton" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                {columns.map((col) => (
                                    <td key={String(col.key)}>
                                        <div className="h-4 w-full skeleton" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Empty state
    if (data.length === 0 && emptyState) {
        return (
            <EmptyState
                icon={emptyState.icon || <Inbox size={48} />}
                title={emptyState.title}
                description={emptyState.description}
                action={emptyState.action}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="table-container card">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    style={{ width: col.width }}
                                    className={cn(
                                        col.align === 'center' && 'text-center',
                                        col.align === 'right' && 'text-right'
                                    )}
                                >
                                    {col.sortable ? (
                                        <button
                                            onClick={() => handleSort(String(col.key))}
                                            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                            aria-label={`Ordenar por ${col.label}`}
                                        >
                                            {col.label}
                                            <span className="flex flex-col">
                                                <ChevronUp
                                                    size={12}
                                                    className={cn(
                                                        '-mb-1',
                                                        sortKey === col.key && sortDirection === 'asc'
                                                            ? 'text-[#CD3529]'
                                                            : 'text-gray-300'
                                                    )}
                                                />
                                                <ChevronDown
                                                    size={12}
                                                    className={cn(
                                                        sortKey === col.key && sortDirection === 'desc'
                                                            ? 'text-[#CD3529]'
                                                            : 'text-gray-300'
                                                    )}
                                                />
                                            </span>
                                        </button>
                                    ) : (
                                        col.label
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, rowIndex) => (
                            <tr
                                key={String(row[rowKey])}
                                onClick={() => onRowClick?.(row)}
                                className={cn(onRowClick && 'cursor-pointer')}
                                tabIndex={onRowClick ? 0 : undefined}
                                onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(row)}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className={cn(
                                            col.align === 'center' && 'text-center',
                                            col.align === 'right' && 'text-right'
                                        )}
                                    >
                                        {col.render
                                            ? col.render(getValue(row, String(col.key)), row, rowIndex)
                                            : String(getValue(row, String(col.key)) ?? '-')
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                        Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} registros
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="btn btn-ghost btn-sm"
                            aria-label="Primera página"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="btn btn-ghost btn-sm"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span className="px-3 py-1 bg-gray-100 rounded-md font-medium">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="btn btn-ghost btn-sm"
                            aria-label="Página siguiente"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="btn btn-ghost btn-sm"
                            aria-label="Última página"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
