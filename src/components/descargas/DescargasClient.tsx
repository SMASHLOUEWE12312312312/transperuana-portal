'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fetchDescargas } from '@/lib/api';
import { ServerDescargasResponse } from '@/lib/server-api';
import { DescargaItem, Compania, TipoSeguro } from '@/lib/types';
import { logger } from '@/lib/logger';
import { formatDateTime, formatFileSize, cn } from '@/lib/utils';
import { Download, FileSpreadsheet, FileWarning, Search, RefreshCw, AlertTriangle } from 'lucide-react';

// API descarga type
interface APIDescarga {
    id: string;
    tipo: 'trama' | 'errores';
    nombreArchivo: string;
    compania: string;
    tipoSeguro: string;
    fechaGeneracion: string;
    idProceso: string;
    url: string;
    tamanio: number | null;
}

// Transform API descarga to DescargaItem
function transformDescarga(d: APIDescarga): DescargaItem {
    return {
        id: d.id,
        idProceso: d.idProceso,
        tipo: d.tipo,
        nombreArchivo: d.nombreArchivo,
        compania: d.compania as Compania,
        tipoSeguro: d.tipoSeguro as TipoSeguro,
        fechaGeneracion: new Date(d.fechaGeneracion),
        url: d.url,
        tamanio: d.tamanio || 0
    };
}

interface DescargasClientProps {
    initialData: ServerDescargasResponse | null;
}

export function DescargasClient({ initialData }: DescargasClientProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Initialize with server data
    const [descargas, setDescargas] = useState<DescargaItem[]>(() => {
        if (!initialData?.descargas) return [];
        return initialData.descargas.map(d => transformDescarga(d as APIDescarga));
    });

    // Refresh function
    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await fetchDescargas();
            const transformed = data.descargas.map((d: APIDescarga) => transformDescarga(d));
            setDescargas(transformed);
            setLastUpdated(new Date());
            logger.info('[Descargas] Datos actualizados');
        } catch (error) {
            console.error('[Descargas] Error al refrescar:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(refreshData, 60000);
        return () => clearInterval(interval);
    }, [refreshData]);

    // Summary counts
    const counts = useMemo(() => ({
        tramas: descargas.filter(d => d.tipo === 'trama').length,
        errores: descargas.filter(d => d.tipo === 'errores').length
    }), [descargas]);

    // Filter data
    const filteredData = useMemo(() => {
        return descargas.filter(item => {
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matchName = item.nombreArchivo.toLowerCase().includes(search);
                const matchId = item.idProceso.toLowerCase().includes(search);
                if (!matchName && !matchId) return false;
            }
            if (filters.compania && item.compania !== filters.compania) return false;
            if (filters.tipoSeguro && item.tipoSeguro !== filters.tipoSeguro) return false;
            if (filters.tipo && item.tipo !== filters.tipo) return false;
            return true;
        });
    }, [descargas, filters]);

    // Handle null initialData - error state
    if (!initialData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900">No se pudieron cargar las descargas</h2>
                    <p className="text-gray-500 mt-2">Verifica la conexión con el sistema</p>
                    <button
                        onClick={refreshData}
                        className="mt-4 px-4 py-2 bg-[#CD3529] text-white rounded-lg hover:bg-[#b02d23] transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const columns: Column<DescargaItem>[] = [
        {
            key: 'tipo',
            label: 'Tipo',
            width: '60px',
            render: (value) => (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${value === 'trama' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                    {value === 'trama' ? <FileSpreadsheet size={20} /> : <FileWarning size={20} />}
                </div>
            )
        },
        {
            key: 'nombreArchivo',
            label: 'Archivo',
            sortable: true,
            render: (value) => (
                <span className="font-medium text-gray-900">{String(value)}</span>
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
            key: 'fechaGeneracion',
            label: 'Fecha',
            sortable: true,
            width: '150px',
            render: (value) => (
                <span className="text-sm text-gray-500">{formatDateTime(value as Date)}</span>
            )
        },
        {
            key: 'tamanio',
            label: 'Tamaño',
            align: 'right',
            width: '100px',
            render: (value) => (
                <span className="text-sm text-gray-500">
                    {value ? formatFileSize(Number(value)) : '—'}
                </span>
            )
        },
        {
            key: 'url',
            label: '',
            width: '80px',
            render: (value) => (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Download size={14} />
                    Descargar
                </a>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Descargas</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Archivos generados disponibles para descarga
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        {filteredData.length} archivos
                    </span>
                    <span className="text-xs text-gray-400">
                        {lastUpdated.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all",
                            "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
                            isRefreshing && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 sm:w-96">
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tramas</p>
                        <p className="text-2xl font-bold text-gray-900">{counts.tramas}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                        <FileWarning size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Reportes Error</p>
                        <p className="text-2xl font-bold text-gray-900">{counts.errores}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[250px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de archivo..."
                        value={filters.search || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="input pl-10 w-full"
                    />
                </div>
                <select
                    value={filters.compania || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, compania: e.target.value }))}
                    className="input w-auto"
                >
                    <option value="">Todas las compañías</option>
                    <option value="RIMAC">Rimac</option>
                    <option value="PACIFICO">Pacífico</option>
                    <option value="MAPFRE">Mapfre</option>
                    <option value="LA_POSITIVA">La Positiva</option>
                    <option value="SANITAS">Sanitas</option>
                </select>
                <select
                    value={filters.tipo || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                    className="input w-auto"
                >
                    <option value="">Todos los tipos</option>
                    <option value="trama">Tramas</option>
                    <option value="errores">Reportes de Error</option>
                </select>
            </div>

            {/* Table */}
            <DataTable<DescargaItem>
                data={filteredData}
                columns={columns}
                rowKey="id"
                pageSize={15}
                emptyState={{
                    icon: <Download size={48} />,
                    title: 'No hay archivos disponibles',
                    description: 'No se encontraron archivos que coincidan con los filtros aplicados.',
                }}
            />
        </div>
    );
}
