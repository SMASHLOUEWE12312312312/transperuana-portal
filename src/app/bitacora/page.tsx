'use client';

import { useState, useEffect, useMemo } from 'react';
import { mockBitacora } from '@/lib/mock-data';
import { fetchBitacora, isUsingMockData } from '@/lib/api';
import { BitacoraCorreo, Compania, TipoSeguro } from '@/lib/types';
import { formatRelativeTime, cn } from '@/lib/utils';
import { Mail, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
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

export default function BitacoraPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResult, setFilterResult] = useState<string>('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [bitacora, setBitacora] = useState<BitacoraCorreo[]>(mockBitacora);
    const [loading, setLoading] = useState(true);
    const [usingMock, setUsingMock] = useState(true);

    // Fetch data from API
    useEffect(() => {
        async function loadData() {
            if (isUsingMockData()) {
                console.log('[Bitácora] Usando datos mock');
                setLoading(false);
                setUsingMock(true);
                return;
            }

            try {
                console.log('[Bitácora] Cargando desde API...');
                const data = await fetchBitacora({ limite: 100 });

                // Transform API response - bitacora structure may vary
                const transformedBitacora: BitacoraCorreo[] = data.bitacora.map((b: Record<string, unknown>) => ({
                    timestamp: new Date(b.timestamp as string || b.FechaHora as string || new Date()),
                    messageId: (b.messageId as string) || (b.MessageId as string) || '',
                    threadId: (b.threadId as string) || (b.ThreadId as string) || '',
                    subject: (b.subject as string) || (b.Subject as string) || (b.Asunto as string) || '',
                    sender: (b.sender as string) || (b.Sender as string) || (b.Remitente as string) || '',
                    attachmentName: (b.attachmentName as string) || (b.AttachmentName as string) || (b.Adjunto as string) || '',
                    attachmentType: (b.attachmentType as string) || '',
                    companiaDetectada: ((b.companiaDetectada as string) || (b.CompaniaDetectada as string) || null) as Compania | null,
                    tipoSeguroDetectado: ((b.tipoSeguroDetectado as string) || (b.TipoSeguroDetectado as string) || null) as TipoSeguro | null,
                    confidenceScore: Number(b.confidenceScore || b.ConfidenceScore || 0),
                    detectionMethod: (b.detectionMethod as string) || '',
                    labelRoute: (b.labelRoute as string) || '',
                    fileIdRaw: (b.fileIdRaw as string) || '',
                    fileIdReady: (b.fileIdReady as string) || null,
                    processingResult: ((b.processingResult as string) || (b.ProcessingResult as string) || (b.Estado as string) || 'PENDIENTE') as 'PROCESADO' | 'PENDIENTE' | 'ERROR' | 'IGNORADO',
                    idProceso: (b.idProceso as string) || (b.IdProceso as string) || null,
                    errorDetail: (b.errorDetail as string) || null,
                    processingTime: Number(b.processingTime || 0)
                }));

                setBitacora(transformedBitacora);
                setUsingMock(false);
                console.log('[Bitácora] Cargados:', data.total);
            } catch (error) {
                console.error('[Bitácora] Error, usando mock:', error);
                setUsingMock(true);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Summary stats
    const stats = useMemo(() => {
        return {
            total: bitacora.length,
            procesados: bitacora.filter(b => b.processingResult === 'PROCESADO').length,
            pendientes: bitacora.filter(b => b.processingResult === 'PENDIENTE').length,
            errores: bitacora.filter(b => b.processingResult === 'ERROR').length
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

    if (loading) {
        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="h-8 w-48 skeleton rounded" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card p-4 h-24 skeleton" />
                    ))}
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="card p-4 h-20 skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bitácora de Correos</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Historial de correos recibidos y procesados
                    </p>
                </div>
                {usingMock && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        ⚠️ Datos de ejemplo
                    </span>
                )}
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
                <div className="relative flex-1 min-w-[250px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por asunto, remitente o adjunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full"
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
                    filteredData.map((item) => (
                        <div
                            key={item.messageId}
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
                                    <p className="text-sm text-gray-500">{formatRelativeTime(item.timestamp)}</p>
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
                                    {item.errorDetail && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                            <strong>Error:</strong> {item.errorDetail}
                                        </div>
                                    )}
                                    {item.idProceso && (
                                        <div className="mt-3">
                                            <a
                                                href={`/procesos/${item.idProceso}`}
                                                className="text-sm text-[#CD3529] hover:underline"
                                            >
                                                Ver proceso asociado →
                                            </a>
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
