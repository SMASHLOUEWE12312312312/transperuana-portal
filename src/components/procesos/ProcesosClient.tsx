'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fetchProcesos } from '@/lib/api';
import { ServerProcesosResponse } from '@/lib/server-api';
import { Proceso, Compania, TipoSeguro, EstadoProceso } from '@/lib/types';
import { formatDateTime, formatDuration, truncate, cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useSmartPolling, POLLING_INTERVALS } from '@/hooks/useSmartPolling';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Download, FileWarning, FileText, RefreshCw, AlertTriangle, User, Users } from 'lucide-react';

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

// Transform API data to Proceso type
function transformProceso(p: APIProceso): Proceso {
    return {
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
    };
}

interface ProcesosClientProps {
    initialData: ServerProcesosResponse | null;
    userRole: string;
    userEmail: string;
}

export function ProcesosClient({ initialData, userRole, userEmail }: ProcesosClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [showOnlyMine, setShowOnlyMine] = useState(false); // Toggle para ADMIN

    // Estados para paginación cursor
    const [allProcesos, setAllProcesos] = useState<Proceso[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const isAdmin = userRole === 'ADMIN';

    // Determinar ownerEmail según rol y toggle
    const getOwnerEmail = useCallback(() => {
        if (!isAdmin) return userEmail; // EJECUTIVO siempre filtra por su email
        return showOnlyMine ? userEmail : 'ALL'; // ADMIN: toggle controla
    }, [isAdmin, showOnlyMine, userEmail]);

    const ownerEmail = getOwnerEmail();

    // Polling inteligente
    const pollingInterval = useSmartPolling(POLLING_INTERVALS.PROCESOS);

    // React Query con queryKey que incluye ownerEmail
    const {
        data: procesosRaw,
        isRefetching,
        dataUpdatedAt,
        isError,
        refetch
    } = useQuery({
        queryKey: ['procesos', ownerEmail], // CRÍTICO: separar cache por ownerEmail
        queryFn: () => fetchProcesos({ limite: 50, ownerEmail }),
        initialData: initialData ? {
            procesos: initialData.procesos,
            total: initialData.total,
            success: true,
            nextCursor: null,
            hasMore: false
        } : undefined,
        refetchInterval: pollingInterval,
        refetchOnMount: 'always',
        staleTime: 3000,
    });

    // Sincronizar datos cuando llegan del query
    useEffect(() => {
        if (procesosRaw?.procesos) {
            setAllProcesos(procesosRaw.procesos.map(p => transformProceso(p as APIProceso)));
            setNextCursor(procesosRaw.nextCursor || null);
            setHasMore(procesosRaw.hasMore || false);
        }
    }, [procesosRaw]);

    // Función para cargar más
    const loadMore = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const moreData = await fetchProcesos({
                limite: 50,
                cursor: nextCursor,
                ownerEmail
            });

            if (moreData.success && moreData.procesos) {
                const newProcesos = moreData.procesos.map(p => transformProceso(p as APIProceso));
                setAllProcesos(prev => [...prev, ...newProcesos]);
                setNextCursor(moreData.nextCursor || null);
                setHasMore(moreData.hasMore || false);
            }
        } catch (error) {
            logger.error('[ProcesosClient] Error loading more:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Invalidar queries cuando cambia el toggle de ADMIN
    useEffect(() => {
        if (isAdmin) {
            queryClient.invalidateQueries({ queryKey: ['procesos'] });
        }
    }, [showOnlyMine, isAdmin, queryClient]);

    // Usar allProcesos en lugar de procesosRaw
    const procesos = allProcesos;

    const totalProcesos = procesosRaw?.total || 0;

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

    const columns = useMemo<Column<Proceso>[]>(() => [
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
        // Columna Responsable solo para ADMIN
        ...(isAdmin ? [{
            key: 'usuario' as keyof Proceso,
            label: 'Responsable',
            sortable: true,
            width: '140px',
            render: (value: unknown) => {
                const email = String(value || '');
                const displayName = email.includes('@') ? email.split('@')[0] : email;
                return (
                    <span className="text-sm text-gray-600" title={email}>
                        {displayName || '-'}
                    </span>
                );
            }
        }] : []),
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
    ], [isAdmin]);

    // Handle error state (AFTER all hooks)
    if (isError && !procesos.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900">No se pudieron cargar los procesos</h2>
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

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Procesos</h1>
                            {isRefetching && (
                                <RefreshCw size={16} className="animate-spin text-gray-400" />
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            Historial de todos los procesamientos de tramas
                            {dataUpdatedAt && (
                                <span className="ml-2 text-gray-400">
                                    · Actualizado {formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: es })}
                                </span>
                            )}
                        </p>
                    </div>
                    {/* Badge/Toggle según rol */}
                    {!isAdmin ? (
                        // EJECUTIVO: Badge fijo
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            <User size={14} />
                            Mis Procesos
                        </span>
                    ) : (
                        // ADMIN: Toggle
                        <button
                            onClick={() => setShowOnlyMine(!showOnlyMine)}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all",
                                showOnlyMine
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                            )}
                        >
                            {showOnlyMine ? (
                                <><User size={14} /> Solo míos</>
                            ) : (
                                <><Users size={14} /> Todos</>
                            )}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        {filteredData.length} de {totalProcesos} procesos
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

            {/* Botón Cargar más */}
            {hasMore && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className={cn(
                            "px-6 py-2 rounded-lg font-medium transition-all",
                            "bg-gray-100 hover:bg-gray-200 text-gray-700",
                            isLoadingMore && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoadingMore ? (
                            <span className="flex items-center gap-2">
                                <RefreshCw size={16} className="animate-spin" />
                                Cargando...
                            </span>
                        ) : (
                            `Cargar más (${procesos.length} de ${totalProcesos})`
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
