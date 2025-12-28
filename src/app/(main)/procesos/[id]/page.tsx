import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime, formatDuration, formatCompanyName } from '@/lib/utils';
import {
    ArrowLeft,
    Download,
    FileWarning,
    Clock,
    User,
    Building,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

// Server-side fetch for proceso detail
async function getProcesoDetalle(id: string) {
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return null;

    try {
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', 'proceso');
        url.searchParams.append('id', id);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            cache: 'force-cache',
            next: { revalidate: 60, tags: ['proceso', id] }
        });

        clearTimeout(timeoutId);

        if (!response.ok) return null;
        const data = await response.json();
        return data.success ? data : null;
    } catch {
        return null;
    }
}

// Generar rutas estáticas para los procesos más recientes
export async function generateStaticParams() {
    return [];
}

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProcesoDetailPage({ params }: Props) {
    const { id } = await params;
    const data = await getProcesoDetalle(id);

    if (!data || !data.proceso) {
        notFound();
    }

    const proceso = data.proceso;
    const errores = data.errores || [];

    // Agrupar errores por tipo
    const errorsByType: Record<string, Array<{
        filaOriginal: number;
        campo: string;
        valorOriginal: string;
        descripcionError: string;
        tipoError: string;
    }>> = {};
    errores.forEach((error: { tipoError: string; filaOriginal: number; campo: string; valorOriginal: string; descripcionError: string }) => {
        if (!errorsByType[error.tipoError]) {
            errorsByType[error.tipoError] = [];
        }
        errorsByType[error.tipoError].push(error);
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Breadcrumb */}
            <div>
                <Link
                    href="/procesos"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Volver a Procesos
                </Link>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">Detalle del Proceso</h1>
                        <StatusBadge status={proceso.estado} type="status" />
                    </div>
                    <p className="text-sm text-gray-500 font-mono">ID: {proceso.idProceso}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {proceso.tramaGeneradaUrl && (
                        <a
                            href={proceso.tramaGeneradaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            <Download size={18} />
                            Descargar Trama
                        </a>
                    )}
                    {proceso.reporteErroresUrl && (
                        <a
                            href={proceso.reporteErroresUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                        >
                            <FileWarning size={18} />
                            Ver Errores
                        </a>
                    )}
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Calendar size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Fecha</p>
                            <p className="font-medium">{formatDateTime(new Date(proceso.fechaHoraProceso))}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <User size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cliente</p>
                            <p className="font-medium">{proceso.cliente}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Building size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Compañía</p>
                            <p className="font-medium">{formatCompanyName(proceso.compania)}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Duración</p>
                            <p className="font-medium">{formatDuration(proceso.duracionSegundos)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Validation Summary */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Resultado de Validación</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-500" />
                                <span>Registros Válidos</span>
                            </div>
                            <span className="font-bold text-green-600">{proceso.registrosOK}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <XCircle size={20} className="text-red-500" />
                                <span>Registros con Error</span>
                            </div>
                            <span className="font-bold text-red-600">{proceso.registrosConError}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="flex items-center gap-2">
                                <FileText size={20} className="text-gray-500" />
                                <span className="font-medium">Total</span>
                            </div>
                            <span className="font-bold">{proceso.registrosTotales}</span>
                        </div>
                    </div>
                </div>

                {/* Process Details */}
                <div className="card p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Detalles del Proceso</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Tipo de Seguro</p>
                            <p className="font-medium">{proceso.tipoSeguro === 'VIDA_LEY' ? 'Vida Ley' : proceso.tipoSeguro}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Archivo Origen</p>
                            <p className="font-medium truncate" title={proceso.archivoOrigenNombre}>
                                {proceso.archivoOrigenNombre}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-gray-500">Mensaje</p>
                            <p className="text-sm">{proceso.mensajeDetalle || 'Sin mensaje'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Errors List */}
            {errores.length > 0 && (
                <div className="card">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">Errores Detectados ({errores.length})</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {Object.entries(errorsByType).map(([tipo, errors]) => (
                            <div key={tipo} className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle size={18} className="text-red-500" />
                                    <span className="font-medium">{tipo}</span>
                                    <span className="text-sm text-gray-500">({errors.length} errores)</span>
                                </div>
                                <div className="space-y-2 pl-6">
                                    {errors.slice(0, 5).map((error, idx) => (
                                        <div key={idx} className="text-sm">
                                            <span className="text-gray-500">Fila {error.filaOriginal}:</span>{' '}
                                            <span className="font-medium">{error.campo}</span>{' '}
                                            <span className="text-gray-600">= &quot;{error.valorOriginal}&quot;</span>
                                            <p className="text-gray-500 text-xs">{error.descripcionError}</p>
                                        </div>
                                    ))}
                                    {errors.length > 5 && (
                                        <p className="text-sm text-gray-400">...y {errors.length - 5} errores más</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
