'use client';

import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
    className?: string; // Support for custom column classes
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    loading?: boolean;
    className?: string; // Support for custom table classes
    emptyState?: {
        icon?: React.ReactNode;
        title: string;
        description: string;
        action?: { label: string; onClick: () => void };
    };
    onRowClick?: (row: T) => void;
    rowKey: keyof T;
    // NUEVO: Habilitar virtualización para listas grandes
    enableVirtualization?: boolean;
    virtualHeight?: number; // Altura del contenedor en px
}

// Umbral para activar virtualización automática
const VIRTUALIZATION_THRESHOLD = 100;

export function DataTable<T extends object>({
    data,
    columns,
    pageSize = 10,
    loading = false,
    className,
    emptyState,
    onRowClick,
    rowKey,
    enableVirtualization = true,
    virtualHeight = 600
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const parentRef = useRef<HTMLDivElement>(null);

    // Determinar si usar virtualización (solo si hay muchas filas)
    const shouldVirtualize = enableVirtualization && data.length > VIRTUALIZATION_THRESHOLD;

    // Reset to page 1 when filtered data shrinks below current page
    const dataLength = data.length;
    if (!shouldVirtualize && currentPage > Math.ceil(dataLength / pageSize) && dataLength > 0) {
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

    // Virtualizer para scroll infinito
    const virtualizer = useVirtualizer({
        count: sortedData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 52, // Altura estimada de cada fila en px
        overscan: 10, // Renderizar 10 filas extra arriba/abajo del viewport
    });

    // Paginate data (solo cuando NO se usa virtualización)
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = shouldVirtualize
        ? sortedData
        : sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            <div className={cn("table-container", className)}>
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={String(col.key)} style={{ width: col.width }} className={col.className}>
                                    <div className="h-4 w-20 skeleton" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                {columns.map((col) => (
                                    <td key={String(col.key)} className={col.className}>
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

    // ========================================
    // RENDERIZADO VIRTUALIZADO (>100 filas)
    // ========================================
    if (shouldVirtualize) {
        return (
            <div className="space-y-4">
                <div className={cn("table-container card border rounded-lg overflow-hidden", className)}>
                    {/* Header fijo */}
                    <div className="bg-gray-50 border-b">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={String(col.key)}
                                            style={{ width: col.width }}
                                            className={cn(
                                                col.align === 'center' && 'text-center',
                                                col.align === 'right' && 'text-right',
                                                col.className
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
                        </table>
                    </div>

                    {/* Body virtualizado con scroll */}
                    <div
                        ref={parentRef}
                        className="overflow-auto"
                        style={{ height: `${virtualHeight}px` }}
                    >
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const row = sortedData[virtualRow.index];
                                return (
                                    <div
                                        key={`${String(row[rowKey])}-${virtualRow.index}`}
                                        onClick={() => onRowClick?.(row)}
                                        className={cn(
                                            "absolute top-0 left-0 w-full flex border-b border-gray-100 hover:bg-gray-50 transition-colors",
                                            onRowClick && "cursor-pointer"
                                        )}
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        {columns.map((col) => (
                                            <div
                                                key={String(col.key)}
                                                className={cn(
                                                    "px-4 py-3 text-sm text-gray-900 flex items-center",
                                                    col.align === 'center' && 'justify-center',
                                                    col.align === 'right' && 'justify-end',
                                                    col.className
                                                )}
                                                style={{ width: col.width, flex: col.width ? 'none' : 1 }}
                                            >
                                                {col.render
                                                    ? col.render(getValue(row, String(col.key)), row, virtualRow.index)
                                                    : String(getValue(row, String(col.key)) ?? '-')}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer con info */}
                    <div className="bg-gray-50 border-t px-4 py-2 text-sm text-gray-500">
                        Mostrando {sortedData.length} registros (scroll virtualizado)
                    </div>
                </div>
            </div>
        );
    }

    // ========================================
    // RENDERIZADO NORMAL CON PAGINACIÓN (<100 filas)
    // ========================================
    return (
        <div className="space-y-4">
            {/* Table */}
            <div className={cn("table-container card", className)}>
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    style={{ width: col.width }}
                                    className={cn(
                                        col.align === 'center' && 'text-center',
                                        col.align === 'right' && 'text-right',
                                        col.className
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
                                key={`${String(row[rowKey])}-${rowIndex}`}
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
                                            col.align === 'right' && 'text-right',
                                            col.className
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
