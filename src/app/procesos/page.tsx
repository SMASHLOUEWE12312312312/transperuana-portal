'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockProcesos } from '@/lib/mock-data';
import { fetchProcesos, isUsingMockData } from '@/lib/api';
import { Proceso, Compania, TipoSeguro, EstadoProceso } from '@/lib/types';
import { formatDateTime, formatDuration, truncate } from '@/lib/utils';
import { Eye, Download, FileWarning, FileText } from 'lucide-react';
import Link from 'next/link';

// Type for API response proceso
interface APIProceso {
    idProceso: string;
    fechaHoraProceso: string;
    usuario: string;
    cliente: string;
    compania: string;
    tipoSeguro: string;
    archivoOrigenNombre: string;
    archivoOrigenId: string;
    registrosTotales: number;
    registrosOK: number;
    registrosConError: number;
    tramaGeneradaId: string;
    tramaGeneradaUrl: string;
    reporteErroresId: string;
    reporteErroresUrl: string;
    estado: string;
    mensajeDetalle: string;
    duracionSegundos: number;
}

export default function ProcesosPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [procesos, setProcesos] = useState<Proceso[]>(mockProcesos);
    const [loading, setLoading] = useState(true);
    const [usingMock, setUsingMock] = useState(true);
    const [totalProcesos, setTotalProcesos] = useState(mockProcesos.length);

    // Fetch data from API
    useEffect(() => {
        async function loadData() {
            if (isUsingMockData()) {
                console.log('[Procesos] Usando datos mock');
                setLoading(false);
                setUsingMock(true);
                return;
            }

            try {
                console.log('[Procesos] Cargando desde API...');
                const data = await fetchProcesos({ limite: 200 });

                // Transform API response to Proceso type
                const transformedProcesos: Proceso[] = data.procesos.map((p: APIProceso) => ({
                    idProceso: p.idProceso,
                    fechaHoraProceso: new Date(p.fechaHoraProceso),
                    usuario: p.usuario,
                    cliente: p.cliente,
                    compania: p.compania as Compania,
                    tipoSeguro: p.tipoSeguro as TipoSeguro,
                    archivoOrigenNombre: p.archivoOrigenNombre,
                    archivoOrigenId: p.archivoOrigenId,
                    registrosTotales: p.registrosTotales,
                    registrosOK: p.registrosOK,
                    registrosConError: p.registrosConError,
                    tramaGeneradaId: p.tramaGeneradaId || null,
                    tramaGeneradaUrl: p.tramaGeneradaUrl || null,
                    reporteErroresId: p.reporteErroresId || null,
                    reporteErroresUrl: p.reporteErroresUrl || null,
                    estado: p.estado as EstadoProceso,
                    mensajeDetalle: p.mensajeDetalle,
                    duracionSegundos: p.duracionSegundos
                }));

                setProcesos(transformedProcesos);
                setTotalProcesos(data.total);
                setUsingMock(false);
                console.log('[Procesos] Cargados:', data.total);
            } catch (error) {
                console.error('[Procesos] Error, usando mock:', error);
                setUsingMock(true);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Get unique clients for filter dropdown
    const clientes = useMemo(() => {
        return [...new Set(procesos.map(p => p.cliente))].sort();
    }, [procesos]);

    // Filter data
    const filteredData = useMemo(() => {
        return procesos.filter(proceso => {
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matchId = proceso.idProceso.toLowerCase().includes(search);
                const matchFile = proceso.archivoOrigenNombre.toLowerCase().includes(search);
                const matchClient = proceso.cliente.toLowerCase().includes(search);
                if (!matchId && !matchFile && !matchClient) return false;
            }
            if (filters.compania && proceso.compania !== filters.compania) return false;
            if (filters.tipoSeguro && proceso.tipoSeguro !== filters.tipoSeguro) return false;
            if (filters.estado && proceso.estado !== filters.estado) return false;
            if (filters.cliente && proceso.cliente !== filters.cliente) return false;

            return true;
        });
    }, [filters, procesos]);

    const columns: Column<Proceso>[] = [
        {
            key: 'idProceso',
            label: 'ID',
            sortable: true,
            width: '120px',
            render: (value) => (
                <span className="font-mono text-xs text-gray-500" title={String(value)}>
                    {String(value).slice(0, 8)}...
                </span>
            )
        },
        {
            key: 'fechaHoraProceso',
            label: 'Fecha',
            sortable: true,
            width: '150px',
            render: (value) => (
                <span className="text-sm">{formatDateTime(value as Date)}</span>
            )
        },
        {
            key: 'cliente',
            label: 'Cliente',
            sortable: true,
            render: (value) => (
                <span className="font-medium text-gray-900" title={String(value)}>
                    {truncate(String(value), 25)}
                </span>
            )
        },
        {
            key: 'compania',
            label: 'Compañía',
            sortable: true,
            width: '120px',
            render: (value) => <StatusBadge status={String(value)} type="company" size="sm" />
        },
        {
            key: 'tipoSeguro',
            label: 'Tipo',
            sortable: true,
            width: '100px',
            render: (value) => <StatusBadge status={String(value)} type="seguro" size="sm" />
        },
        {
            key: 'estado',
            label: 'Estado',
            sortable: true,
            width: '140px',
            render: (value) => <StatusBadge status={String(value)} type="status" />
        },
        {
            key: 'registrosOK',
            label: 'OK',
            align: 'right',
            width: '60px',
            render: (value) => (
                <span className="text-green-600 font-medium">{String(value)}</span>
            )
        },
        {
            key: 'registrosConError',
            label: 'Err',
            align: 'right',
            width: '60px',
            render: (value) => (
                <span className={Number(value) > 0 ? 'text-red-500 font-medium' : 'text-gray-400'}>
                    {String(value)}
                </span>
            )
        },
        {
            key: 'duracionSegundos',
            label: 'Tiempo',
            align: 'right',
            width: '80px',
            render: (value) => (
                <span className="text-sm text-gray-500">{formatDuration(Number(value))}</span>
            )
        },
        {
            key: 'actions',
            label: '',
            width: '120px',
            render: (_, row) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link
                        href={`/procesos/${row.idProceso}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver detalle"
                        aria-label="Ver detalle del proceso"
                    >
                        <Eye size={16} />
                    </Link>
                    {row.tramaGeneradaUrl && (
                        <a
                            href={row.tramaGeneradaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Descargar trama"
                            aria-label="Descargar trama generada"
                        >
                            <Download size={16} />
                        </a>
                    )}
                    {row.reporteErroresUrl && (
                        <a
                            href={row.reporteErroresUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Descargar reporte de errores"
                            aria-label="Descargar reporte de errores"
                        >
                            <FileWarning size={16} />
                        </a>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Procesos</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Historial de todos los procesamientos de tramas
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {usingMock && !loading && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            ⚠️ Datos de ejemplo
                        </span>
                    )}
                    <span className="text-sm text-gray-500">
                        {filteredData.length} de {totalProcesos} procesos
                    </span>
                </div>
            </div>

            {/* Filters */}
            <FilterPanel
                onFilterChange={setFilters}
                filters={{
                    search: true,
                    dateRange: true,
                    cliente: true,
                    compania: true,
                    tipoSeguro: true,
                    estado: true
                }}
                clientes={clientes}
            />

            {/* Table */}
            <DataTable<Proceso>
                data={filteredData}
                columns={columns}
                rowKey="idProceso"
                pageSize={15}
                loading={loading}
                onRowClick={(row) => router.push(`/procesos/${row.idProceso}`)}
                emptyState={{
                    icon: <FileText size={48} />,
                    title: 'No se encontraron procesos',
                    description: 'No hay procesos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.',
                    action: {
                        label: 'Limpiar filtros',
                        onClick: () => setFilters({})
                    }
                }}
            />
        </div>
    );
}
