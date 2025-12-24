'use client';

import { use, useMemo } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { mockProcesos, generateMockErrores } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime, formatDuration, formatCompanyName, getErrorTypeColorClass } from '@/lib/utils';
import {
    ArrowLeft,
    Download,
    FileWarning,
    ExternalLink,
    Clock,
    User,
    Building,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface ProcesoDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function ProcesoDetailPage({ params }: ProcesoDetailPageProps) {
    const { id } = use(params);

    // Find process
    const proceso = useMemo(() => {
        return mockProcesos.find(p => p.idProceso === id);
    }, [id]);

    // Generate mock errors for this process
    const errores = useMemo(() => {
        if (!proceso || proceso.registrosConError === 0) return [];
        return generateMockErrores(id, proceso.registrosConError);
    }, [id, proceso]);

    if (!proceso) {
        notFound();
    }

    // Chart data for validation stats
    const validationData = [
        { name: 'Válidos', value: proceso.registrosOK, color: '#22C55E' },
        { name: 'Con Error', value: proceso.registrosConError, color: '#EF4444' }
    ];

    // Group errors by type
    const errorsByType = useMemo(() => {
        const groups: Record<string, typeof errores> = {};
        errores.forEach(error => {
            if (!groups[error.tipoError]) {
                groups[error.tipoError] = [];
            }
            groups[error.tipoError].push(error);
        });
        return groups;
    }, [errores]);

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
                            download
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
                            download
                            className="btn btn-secondary"
                        >
                            <FileWarning size={18} />
                            Reporte de Errores
                        </a>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Info & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
                        </div>
                        <div className="card-body">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Building className="text-gray-400 mt-0.5" size={18} />
                                    <div>
                                        <dt className="text-xs text-gray-500 uppercase tracking-wide">Cliente</dt>
                                        <dd className="font-medium text-gray-900">{proceso.cliente}</dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FileText className="text-gray-400 mt-0.5" size={18} />
                                    <div>
                                        <dt className="text-xs text-gray-500 uppercase tracking-wide">Archivo</dt>
                                        <dd className="font-medium text-gray-900 break-all text-sm">
                                            {proceso.archivoOrigenNombre}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="text-gray-400 mt-0.5" size={18} />
                                    <div>
                                        <dt className="text-xs text-gray-500 uppercase tracking-wide">Fecha/Hora</dt>
                                        <dd className="font-medium text-gray-900">
                                            {formatDateTime(proceso.fechaHoraProceso)}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="text-gray-400 mt-0.5" size={18} />
                                    <div>
                                        <dt className="text-xs text-gray-500 uppercase tracking-wide">Usuario</dt>
                                        <dd className="font-medium text-gray-900">{proceso.usuario}</dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="text-gray-400 mt-0.5" size={18} />
                                    <div>
                                        <dt className="text-xs text-gray-500 uppercase tracking-wide">Duración</dt>
                                        <dd className="font-medium text-gray-900">
                                            {formatDuration(proceso.duracionSegundos)}
                                        </dd>
                                    </div>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1">Compañía / Tipo</dt>
                                    <dd className="flex items-center gap-2">
                                        <StatusBadge status={proceso.compania} type="company" size="sm" />
                                        <StatusBadge status={proceso.tipoSeguro} type="seguro" size="sm" />
                                    </dd>
                                </div>
                            </dl>

                            {/* Message */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600">{proceso.mensajeDetalle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Errors Detail */}
                    {errores.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Errores Detectados ({errores.length})
                                </h2>
                            </div>
                            <div className="card-body space-y-4">
                                {Object.entries(errorsByType).map(([tipo, errors]) => (
                                    <div key={tipo}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <StatusBadge status={tipo} type="error" size="sm" />
                                            <span className="text-sm text-gray-500">
                                                ({errors.length} {errors.length === 1 ? 'error' : 'errores'})
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Fila</th>
                                                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Campo</th>
                                                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Valor</th>
                                                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Descripción</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {errors.slice(0, 5).map((error, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                            <td className="px-3 py-2 font-mono text-gray-600">{error.filaOriginal}</td>
                                                            <td className="px-3 py-2 font-medium text-gray-900">{error.campo}</td>
                                                            <td className="px-3 py-2 text-gray-500">
                                                                <code className="bg-gray-100 px-1 rounded text-xs">
                                                                    {error.valorOriginal || '(vacío)'}
                                                                </code>
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-600">{error.descripcionError}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {errors.length > 5 && (
                                                <div className="px-3 py-2 bg-gray-100 text-center text-sm text-gray-500">
                                                    Y {errors.length - 5} errores más...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Validation Stats */}
                <div className="space-y-6">
                    {/* Validation Donut */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold text-gray-900">Validación</h2>
                        </div>
                        <div className="card-body">
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={validationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {validationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stats */}
                            <div className="space-y-3 mt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="text-green-500" size={18} />
                                        <span className="text-gray-600">Registros Válidos</span>
                                    </div>
                                    <span className="font-bold text-green-600">{proceso.registrosOK}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="text-red-500" size={18} />
                                        <span className="text-gray-600">Con Error</span>
                                    </div>
                                    <span className="font-bold text-red-500">{proceso.registrosConError}</span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="text-gray-400" size={18} />
                                        <span className="text-gray-600">Total</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{proceso.registrosTotales}</span>
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                                <span className="text-sm text-gray-500">Tasa de Éxito</span>
                                <p className="text-3xl font-bold text-[#CD3529]">
                                    {((proceso.registrosOK / proceso.registrosTotales) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold text-gray-900">Archivos</h2>
                        </div>
                        <div className="card-body space-y-2">
                            {proceso.tramaGeneradaUrl ? (
                                <a
                                    href={proceso.tramaGeneradaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Download className="text-green-600" size={18} />
                                        <span className="text-green-800 font-medium">Trama Generada</span>
                                    </div>
                                    <ExternalLink className="text-green-600" size={16} />
                                </a>
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-400 text-center">
                                    No hay trama generada
                                </div>
                            )}

                            {proceso.reporteErroresUrl ? (
                                <a
                                    href={proceso.reporteErroresUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileWarning className="text-red-600" size={18} />
                                        <span className="text-red-800 font-medium">Reporte de Errores</span>
                                    </div>
                                    <ExternalLink className="text-red-600" size={16} />
                                </a>
                            ) : proceso.registrosConError === 0 ? (
                                <div className="p-3 bg-green-50 rounded-lg text-green-600 text-center">
                                    ✓ Sin errores detectados
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
