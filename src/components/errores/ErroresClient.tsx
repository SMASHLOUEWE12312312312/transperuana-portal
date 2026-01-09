'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fetchErrores } from '@/lib/api';
import { ServerErroresResponse } from '@/lib/server-api';
import { ErrorDetalle, TipoError } from '@/lib/types';
import { formatDateTime, cn } from '@/lib/utils';
import { useSmartPolling, POLLING_INTERVALS } from '@/hooks/useSmartPolling';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Search, ExternalLink, RefreshCw } from 'lucide-react';

// Type for API error
interface APIError {
    idProceso: string;
    fechaHora: string;
    filaOriginal: number;
    campo: string;
    valorOriginal: string;
    tipoError: string;
    descripcionError: string;
}

// Transform API error to ErrorDetalle
function transformError(e: APIError): ErrorDetalle {
    return {
        idProceso: e.idProceso,
        fechaHora: new Date(e.fechaHora),
        filaOriginal: e.filaOriginal,
        campo: e.campo,
        valorOriginal: e.valorOriginal,
        tipoError: e.tipoError as TipoError,
        descripcionError: e.descripcionError
    };
}

interface ErroresClientProps {
    initialData: ServerErroresResponse | null;
}

export function ErroresClient({ initialData }: ErroresClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');

    // Polling inteligente (30s para errores)
    const pollingInterval = useSmartPolling(POLLING_INTERVALS.ERRORES);

    // React Query
    const {
        data: erroresRaw,
        isRefetching,
        dataUpdatedAt,
        isError,
        refetch
    } = useQuery({
        queryKey: ['errores'],
        queryFn: () => fetchErrores({ limite: 500 }),
        initialData: initialData ? {
            errores: initialData.errores,
            total: initialData.total,
            success: true
        } : undefined,
        refetchInterval: pollingInterval,
        refetchOnMount: 'always',
        staleTime: 10000, // 10 segundos
    });

    // Transformar datos
    const errores = useMemo(() => {
        if (!erroresRaw?.errores) return [];
        return erroresRaw.errores.map(e => transformError(e as APIError));
    }, [erroresRaw]);

    // Group errors by type for summary
    const errorSummary = useMemo(() => {
        const counts: Record<string, number> = {};
        errores.forEach(e => {
            counts[e.tipoError] = (counts[e.tipoError] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([tipoError, cantidad]) => ({ tipoError, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);
    }, [errores]);

    // Filter data
    const filteredData = useMemo(() => {
        return errores.filter(error => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const matchCampo = error.campo.toLowerCase().includes(search);
                const matchValor = error.valorOriginal.toLowerCase().includes(search);
                const matchDesc = error.descripcionError.toLowerCase().includes(search);
                if (!matchCampo && !matchValor && !matchDesc) return false;
            }
            if (filterType && error.tipoError !== filterType) return false;
            return true;
        });
    }, [errores, searchTerm, filterType]);

    // Handle error state
    if (isError && !errores.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900">No se pudieron cargar los errores</h2>
                    <p className="text-gray-500 mt-2">Verifica la conexión con el sistema</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 px-4 py-2 bg-[#CD3529] text-white rounded-lg hover:bg-[#b02d23] transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const columns: Column<ErrorDetalle>[] = [
        {
            key: 'idProceso',
            label: 'PROCESO',
            width: '100px',
            sortable: true,
            render: (value) => (
                <Link
                    href={`/procesos/${value}`}
                    className="text-[#CD3529] hover:underline font-mono text-xs"
                    onClick={(e) => e.stopPropagation()}
                >
                    {String(value).substring(0, 12)}... <ExternalLink size={12} className="inline" />
                </Link>
            ),
        },
        {
            key: 'fechaHora',
            label: 'Fecha',
            width: '130px',
            sortable: true,
            render: (value) => (
                <span className="text-xs text-gray-600">
                    {formatDateTime(new Date(String(value)))}
                </span>
            ),
        },
        {
            key: 'filaOriginal',
            label: 'FILA',
            width: '50px',
            align: 'center',
            render: (value) => (
                <span className="text-xs font-mono">{String(value)}</span>
            ),
        },
        {
            key: 'campo',
            label: 'Campo',
            width: '120px',
            sortable: true,
            render: (value) => (
                <span className="cell-truncate text-xs font-medium" title={String(value)}>
                    {String(value)}
                </span>
            ),
        },
        {
            key: 'valorOriginal',
            label: 'VALOR ORIGINAL',
            width: '140px',
            render: (value) => (
                <span className="cell-truncate text-xs text-gray-500 font-mono" title={String(value || '(vacío)')}>
                    {value ? String(value) : <span className="italic text-gray-400">(vacío)</span>}
                </span>
            ),
        },
        {
            key: 'tipoError',
            label: 'Tipo',
            width: '150px',
            sortable: true,
            render: (value) => (
                <span className={cn(
                    "badge-error-type",
                    value === 'OBLIGATORIO_VACIO' && 'badge-obligatorio-vacio',
                    value === 'FORMATO' && 'badge-formato',
                    value === 'OBLIGATORIO' && 'badge-obligatorio',
                    value === 'LONGITUD' && 'badge-longitud',
                    value === 'VALIDACION' && 'badge-validacion',
                    value === 'DUPLICADO' && 'badge-duplicado'
                )} title={String(value)}>
                    {String(value)}
                </span>
            ),
        },
        {
            key: 'descripcionError',
            label: 'DESCRIPCIÓN',
            width: 'auto',
            render: (value) => (
                <span className="cell-truncate text-xs text-gray-600" title={String(value)}>
                    {String(value)}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">Errores</h1>
                        {isRefetching && (
                            <RefreshCw size={16} className="animate-spin text-gray-400" />
                        )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Detalle de todos los errores detectados en los procesamientos
                        {dataUpdatedAt && (
                            <span className="ml-2 text-gray-400">
                                · Actualizado {formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: es })}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        {filteredData.length} errores
                    </span>
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all",
                            "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
                            isRefetching && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <RefreshCw size={16} className={cn(isRefetching && "animate-spin")} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Error Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {errorSummary.map(({ tipoError, cantidad }) => (
                    <button
                        key={tipoError}
                        onClick={() => setFilterType(filterType === tipoError ? '' : tipoError)}
                        className={`card p-4 text-center transition-all ${filterType === tipoError ? 'ring-2 ring-[#CD3529] ring-offset-2' : ''
                            }`}
                    >
                        <StatusBadge status={tipoError} type="error" size="sm" />
                        <p className="text-2xl font-bold text-gray-900 mt-2">{cantidad}</p>
                    </button>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="search-input-container flex-1 min-w-[250px]">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por campo, valor o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input search-input"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="input w-auto"
                >
                    <option value="">Todos los tipos</option>
                    {errorSummary.map(({ tipoError }) => (
                        <option key={tipoError} value={tipoError}>{tipoError}</option>
                    ))}
                </select>
                {(searchTerm || filterType) && (
                    <button
                        onClick={() => { setSearchTerm(''); setFilterType(''); }}
                        className="btn btn-ghost"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Table */}
            <DataTable<ErrorDetalle>
                data={filteredData}
                columns={columns}
                rowKey="idProceso"
                pageSize={20}
                emptyState={{
                    icon: <AlertTriangle size={48} />,
                    title: 'No se encontraron errores',
                    description: filterType || searchTerm
                        ? 'No hay errores que coincidan con los filtros. Intenta ajustar la búsqueda.'
                        : '¡Excelente! No hay errores registrados en el sistema.',
                }}
            />
        </div>
    );
}
