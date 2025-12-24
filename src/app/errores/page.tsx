'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { generateMockErrores, mockProcesos } from '@/lib/mock-data';
import { fetchErrores, isUsingMockData } from '@/lib/api';
import { ErrorDetalle, TipoError } from '@/lib/types';
import { formatDateTime, truncate } from '@/lib/utils';
import { AlertTriangle, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

export default function ErroresPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [errores, setErrores] = useState<ErrorDetalle[]>([]);
    const [loading, setLoading] = useState(true);
    const [usingMock, setUsingMock] = useState(true);

    // Generate mock errores from processes
    const mockErrores = useMemo(() => {
        return mockProcesos
            .filter(p => p.registrosConError > 0)
            .slice(0, 10)
            .flatMap(p => generateMockErrores(p.idProceso, Math.min(p.registrosConError, 5)));
    }, []);

    // Fetch data from API
    useEffect(() => {
        async function loadData() {
            if (isUsingMockData()) {
                console.log('[Errores] Usando datos mock');
                setErrores(mockErrores);
                setLoading(false);
                setUsingMock(true);
                return;
            }

            try {
                console.log('[Errores] Cargando desde API...');
                const data = await fetchErrores({ limite: 500 });

                const transformedErrores: ErrorDetalle[] = data.errores.map((e: APIError) => ({
                    idProceso: e.idProceso,
                    fechaHora: new Date(e.fechaHora),
                    filaOriginal: e.filaOriginal,
                    campo: e.campo,
                    valorOriginal: e.valorOriginal,
                    tipoError: e.tipoError as TipoError,
                    descripcionError: e.descripcionError
                }));

                setErrores(transformedErrores);
                setUsingMock(false);
                console.log('[Errores] Cargados:', data.total);
            } catch (error) {
                console.error('[Errores] Error, usando mock:', error);
                setErrores(mockErrores);
                setUsingMock(true);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [mockErrores]);

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

    const columns: Column<ErrorDetalle>[] = [
        {
            key: 'idProceso',
            label: 'Proceso',
            width: '120px',
            render: (value) => (
                <Link
                    href={`/procesos/${value}`}
                    className="font-mono text-xs text-[#CD3529] hover:underline flex items-center gap-1"
                    title={String(value)}
                >
                    {String(value).slice(0, 8)}...
                    <ExternalLink size={12} />
                </Link>
            )
        },
        {
            key: 'fechaHora',
            label: 'Fecha',
            sortable: true,
            width: '140px',
            render: (value) => (
                <span className="text-sm text-gray-500">{formatDateTime(value as Date)}</span>
            )
        },
        {
            key: 'filaOriginal',
            label: 'Fila',
            align: 'center',
            width: '60px',
            render: (value) => (
                <span className="font-mono text-sm">{String(value)}</span>
            )
        },
        {
            key: 'campo',
            label: 'Campo',
            sortable: true,
            width: '150px',
            render: (value) => (
                <span className="font-medium text-gray-900">{String(value)}</span>
            )
        },
        {
            key: 'valorOriginal',
            label: 'Valor Original',
            render: (value) => (
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700" title={String(value)}>
                    {truncate(String(value) || '(vacío)', 30)}
                </code>
            )
        },
        {
            key: 'tipoError',
            label: 'Tipo',
            sortable: true,
            width: '120px',
            render: (value) => <StatusBadge status={String(value)} type="error" size="sm" />
        },
        {
            key: 'descripcionError',
            label: 'Descripción',
            render: (value) => (
                <span className="text-sm text-gray-600" title={String(value)}>
                    {truncate(String(value), 50)}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Errores</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Detalle de todos los errores detectados en los procesamientos
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {usingMock && !loading && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            ⚠️ Datos de ejemplo
                        </span>
                    )}
                    <span className="text-sm text-gray-500">
                        {filteredData.length} errores
                    </span>
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
                <div className="relative flex-1 min-w-[250px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por campo, valor o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full"
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
                loading={loading}
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
