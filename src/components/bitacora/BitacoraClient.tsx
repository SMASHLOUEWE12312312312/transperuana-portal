'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchBitacora } from '@/lib/api';
import { ServerBitacoraResponse } from '@/lib/server-api';
import { BitacoraCorreo, Compania, TipoSeguro } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSmartPolling, POLLING_INTERVALS } from '@/hooks/useSmartPolling';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

const RESULT_COLORS: Record<string, string> = {
    'PROCESADO': 'text-green-600 bg-green-50',
    'PENDIENTE': 'text-yellow-600 bg-yellow-50',
    'ERROR': 'text-red-600 bg-red-50',
    'IGNORADO': 'text-gray-500 bg-gray-50'
};

const RESULT_ICONS: Record<string, React.ReactNode> = {
    'PROCESADO': <CheckCircle size={16} />,
    'PENDIENTE': <Clock size={16} />,
    'ERROR': <XCircle size={16} />,
    'IGNORADO': <AlertCircle size={16} />
};

/**
 * Parsea timestamp de forma segura sin fallback a new Date()
 * Soporta Date, number (epoch), y string ISO/date
 */
function parseTimestampSafe(...values: unknown[]): Date | null {
    for (const val of values) {
        if (!val) continue;

        // Si ya es Date
        if (val instanceof Date && !isNaN(val.getTime())) {
            return val;
        }

        // Si es número (epoch)
        if (typeof val === 'number' && val > 0) {
            const d = new Date(val);
            if (!isNaN(d.getTime()) && d.getFullYear() > 2020) {
                return d;
            }
        }

        // Si es string
        if (typeof val === 'string' && val.trim()) {
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2020) {
                return parsed;
            }
        }
    }
    return null; // Sin fecha válida, NO usar new Date()
}

/**
 * Formatea fecha en formato fijo dd/MM/yyyy HH:mm
 */
function formatDateTime(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Transform API response to BitacoraCorreo
// Mapea campos del API a estructura interna, con fallbacks para nombres del Sheet
function transformBitacora(b: Record<string, unknown>): BitacoraCorreo {
    // Acceso seguro a propiedades con acentos
    const bAny = b as Record<string, unknown>;

    return {
        timestamp: parseTimestampSafe(b.timestamp, b.Timestamp, b.FechaHora, b.fechaCorreo),
        messageId: (b.messageId as string) || (b.MessageId as string) || '',
        threadId: (b.threadId as string) || (b.ThreadId as string) || '',
        subject: (b.subject as string) || (b.Subject as string) || (b.Asunto as string) || '',
        sender: (b.sender as string) || (b.Sender as string) || (b.Remitente as string) || (b.from as string) || (b.From as string) || '',
        attachmentName: (b.attachmentName as string) || (b.AttachmentName as string) || (b.Adjunto as string) || (b.attachment as string) || (b.Attachment as string) || '',
        attachmentType: (b.attachmentType as string) || '',
        // Compañía: múltiples fallbacks incluyendo acentos
        companiaDetectada: ((b.companiaDetectada ?? b.CompaniaDetectada ?? b.compania ?? b.Compania ?? bAny['Compañía'] ?? null) as string | null) as Compania | null,
        // Tipo Seguro
        tipoSeguroDetectado: ((b.tipoSeguroDetectado ?? b.TipoSeguroDetectado ?? b.tipoSeguro ?? b.TipoSeguro ?? null) as string | null) as TipoSeguro | null,
        // Score/Confianza - NORMALIZAR: si llega > 1.5 asumimos 0-100
        confidenceScore: (() => {
            const raw = Number(b.confidenceScore ?? b.ConfidenceScore ?? b.score ?? b.Score ?? 0);
            const normalized = raw > 1.5 ? raw / 100 : raw;
            return Math.min(Math.max(normalized, 0), 1); // clamp 0-1
        })(),
        // Método Detección con acentos
        detectionMethod: (b.detectionMethod as string) || (b.metodoDeteccion as string) || (b.MetodoDeteccion as string) || (bAny['MétodoDetección'] as string) || '',
        labelRoute: (b.labelRoute as string) || '',
        fileIdRaw: (b.fileIdRaw as string) || '',
        fileIdReady: (b.fileIdReady as string) || null,
        processingResult: ((b.processingResult ?? b.ProcessingResult ?? b.Estado ?? b.estado ?? 'PENDIENTE') as string).toUpperCase() as 'PROCESADO' | 'PENDIENTE' | 'ERROR' | 'IGNORADO',
        idProceso: (b.idProceso as string) || (b.IdProceso as string) || null,
        errorDetail: (b.errorDetail as string) || (b.ErrorResumen as string) || (b.errorResumen as string) || null,
        conflictos: (b.conflictos as string) || (b.Conflictos as string) || null,
        // Tiempo procesamiento con acentos
        processingTime: Number(b.processingTime ?? b.ProcessingTime ?? b.duracionSeg ?? b.DuracionSeg ?? bAny['DuraciónSeg'] ?? 0)
    };
}

interface BitacoraClientProps {
    initialData: ServerBitacoraResponse | null;
}

export function BitacoraClient({ initialData }: BitacoraClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResult, setFilterResult] = useState<string>('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Polling inteligente (pausa cuando tab hidden)
    const pollingInterval = useSmartPolling(POLLING_INTERVALS.BITACORA);

    // React Query para fetching con cache inteligente
    const {
        data: bitacoraRaw,
        isRefetching,
        dataUpdatedAt,
        isError,
        refetch
    } = useQuery({
        queryKey: ['bitacora'],
        queryFn: () => fetchBitacora({ limite: 100 }),
        initialData: initialData ? {
            bitacora: initialData.bitacora,
            total: initialData.total,
            success: true
        } : undefined,
        refetchInterval: pollingInterval,
        refetchOnMount: 'always',
        staleTime: 3000, // 3 segundos
    });

    // Transformar datos
    const bitacora = useMemo(() => {
        if (!bitacoraRaw?.bitacora) return [];
        return bitacoraRaw.bitacora.map(b => transformBitacora(b as Record<string, unknown>));
    }, [bitacoraRaw]);

    // Summary stats - IGNORADO no cuenta como error
    const stats = useMemo(() => {
        return {
            total: bitacora.length,
            procesados: bitacora.filter(b => b.processingResult === 'PROCESADO').length,
            pendientes: bitacora.filter(b => b.processingResult === 'PENDIENTE').length,
            errores: bitacora.filter(b => b.processingResult === 'ERROR').length,
            ignorados: bitacora.filter(b => b.processingResult === 'IGNORADO').length
        };
    }, [bitacora]);

    // Filter data
    const filteredData = useMemo(() => {
        return bitacora.filter(item => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const matchSubject = item.subject.toLowerCase().includes(search);
                const matchSender = item.sender.toLowerCase().includes(search);
                const matchAttachment = item.attachmentName?.toLowerCase().includes(search);
                if (!matchSubject && !matchSender && !matchAttachment) return false;
            }
            if (filterResult && item.processingResult !== filterResult) return false;
            return true;
        });
    }, [bitacora, searchTerm, filterResult]);

    // Handle error state
    if (isError && !bitacora.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900">No se pudo cargar la bitácora</h2>
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
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">Bitácora de Correos</h1>
                        {isRefetching && (
                            <RefreshCw size={16} className="animate-spin text-gray-400" />
                        )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Historial de correos recibidos y procesados
                        {dataUpdatedAt && (
                            <span className="ml-2 text-gray-400">
                                · Actualizado {formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: es })}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-green-600">Procesados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.procesados}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-yellow-600">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-red-600">Con Error</p>
                    <p className="text-2xl font-bold text-red-600">{stats.errores}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="search-input-container flex-1 min-w-[250px]">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por asunto, remitente o adjunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input search-input"
                    />
                </div>
                <select
                    value={filterResult}
                    onChange={(e) => setFilterResult(e.target.value)}
                    className="input w-auto"
                >
                    <option value="">Todos los estados</option>
                    <option value="PROCESADO">Procesados</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="ERROR">Con Error</option>
                    <option value="IGNORADO">Ignorados</option>
                </select>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
                {filteredData.length === 0 ? (
                    <div className="card p-8 text-center">
                        <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No se encontraron correos</p>
                    </div>
                ) : (
                    filteredData.map((item, index) => (
                        <div
                            key={`${item.messageId}-${index}`}
                            className="card overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedId(expandedId === item.messageId ? null : item.messageId)}
                                className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    RESULT_COLORS[item.processingResult] || 'bg-gray-50 text-gray-500'
                                )}>
                                    {RESULT_ICONS[item.processingResult] || <Mail size={16} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 truncate">{item.subject}</p>
                                        {item.companiaDetectada && (
                                            <StatusBadge status={item.companiaDetectada} type="company" size="sm" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {item.sender} • {item.attachmentName}
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-sm text-gray-500">{formatDateTime(item.timestamp)}</p>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        RESULT_COLORS[item.processingResult]
                                    )}>
                                        {item.processingResult}
                                    </span>
                                </div>

                                {expandedId === item.messageId ? (
                                    <ChevronUp size={20} className="text-gray-400 shrink-0" />
                                ) : (
                                    <ChevronDown size={20} className="text-gray-400 shrink-0" />
                                )}
                            </button>

                            {expandedId === item.messageId && (
                                <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Método de detección</p>
                                            <p className="font-medium">{item.detectionMethod || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Confianza</p>
                                            <p className="font-medium">{item.confidenceScore ? `${(item.confidenceScore * 100).toFixed(0)}%` : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Tipo Seguro</p>
                                            <p className="font-medium">{item.tipoSeguroDetectado || 'No detectado'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Tiempo procesamiento</p>
                                            <p className="font-medium">{item.processingTime ? `${item.processingTime}s` : 'N/A'}</p>
                                        </div>
                                    </div>
                                    {/* IGNORADO: motivo en gris */}
                                    {item.processingResult === 'IGNORADO' && item.errorDetail && (
                                        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                                            <strong>Motivo:</strong> {item.errorDetail}
                                        </div>
                                    )}
                                    {/* ERROR: en rojo */}
                                    {item.processingResult === 'ERROR' && (item.errorDetail || item.conflictos) && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 space-y-1">
                                            {item.errorDetail && (
                                                <p><strong>Error:</strong> {item.errorDetail}</p>
                                            )}
                                            {item.conflictos && (
                                                <p className="text-red-600"><strong>Detalle:</strong> {item.conflictos}</p>
                                            )}
                                        </div>
                                    )}
                                    {item.idProceso && (
                                        <div className="mt-3">
                                            <Link
                                                href={`/procesos/${item.idProceso}`}
                                                className="text-sm text-[#CD3529] hover:underline"
                                            >
                                                Ver proceso asociado →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
