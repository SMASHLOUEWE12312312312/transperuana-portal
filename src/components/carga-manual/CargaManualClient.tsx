'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileUploader } from '@/components/ui/FileUploader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Download,
    FileText,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchCompaniasCargaManual, procesarCargaManual, CargaManualResultado } from '@/lib/api';

export function CargaManualClient() {
    // Estados
    const [compania, setCompania] = useState('');
    const [tipoSeguro, setTipoSeguro] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [resultado, setResultado] = useState<CargaManualResultado | null>(null);

    // Query para obtener compañías
    const { data: companiasData, isLoading: loadingCompanias } = useQuery({
        queryKey: ['companiasCargaManual'],
        queryFn: fetchCompaniasCargaManual,
        staleTime: 5 * 60 * 1000, // 5 min cache
    });

    // Mutation para procesar
    const procesarMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile || !compania || !tipoSeguro) {
                throw new Error('Datos incompletos');
            }
            return procesarCargaManual(selectedFile, compania, tipoSeguro);
        },
        onSuccess: (data) => {
            setResultado(data);
            if (data.registrosError > 0) {
                toast.warning(`Proceso completado con ${data.registrosError} errores`);
            } else {
                toast.success('Archivo procesado exitosamente');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al procesar archivo');
        }
    });

    // Reset tipo de seguro cuando cambia compañía - movido al handler
    const handleCompaniaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCompania(e.target.value);
        setTipoSeguro(''); // Reset inline to avoid useEffect cascading renders
    };

    // Obtener tipos de seguro para la compañía seleccionada
    const tiposSeguroDisponibles = compania && companiasData?.companias
        ? companiasData.companias[compania] || []
        : [];

    // Validar si puede procesar
    const canProcess = compania && tipoSeguro && selectedFile && !procesarMutation.isPending;

    // Reset para nuevo proceso
    const handleReset = () => {
        setSelectedFile(null);
        setResultado(null);
        procesarMutation.reset();
    };

    return (
        <div className="space-y-6">
            {/* Card principal */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-semibold">Configuración de Proceso</h2>
                </div>
                <div className="card-body space-y-6">
                    {/* Selectores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Compañía */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Compañía <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={compania}
                                onChange={handleCompaniaChange}
                                className="input w-full"
                                disabled={loadingCompanias || procesarMutation.isPending}
                            >
                                <option value="">Seleccionar compañía...</option>
                                {companiasData?.companias && Object.keys(companiasData.companias).sort().map((comp) => (
                                    <option key={comp} value={comp}>{comp}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tipo de Seguro */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Seguro <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={tipoSeguro}
                                onChange={(e) => setTipoSeguro(e.target.value)}
                                className="input w-full"
                                disabled={!compania || procesarMutation.isPending}
                            >
                                <option value="">
                                    {compania ? 'Seleccionar tipo...' : 'Primero seleccione compañía'}
                                </option>
                                {tiposSeguroDisponibles.map((tipo: string) => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* File Uploader */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Archivo Excel <span className="text-red-500">*</span>
                        </label>
                        <FileUploader
                            onFileSelect={setSelectedFile}
                            onFileRemove={() => setSelectedFile(null)}
                            selectedFile={selectedFile}
                            disabled={procesarMutation.isPending}
                            error={procesarMutation.error?.message}
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        {resultado && (
                            <button
                                onClick={handleReset}
                                className="btn btn-ghost flex items-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Nuevo Proceso
                            </button>
                        )}
                        <button
                            onClick={() => procesarMutation.mutate()}
                            disabled={!canProcess}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            {procesarMutation.isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <FileText size={18} />
                                    Procesar Archivo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading state */}
            {procesarMutation.isPending && (
                <div className="card p-8">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={48} className="animate-spin text-[#CD3529]" />
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-900">Procesando archivo...</p>
                            <p className="text-sm text-gray-500">Esto puede tomar unos segundos</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Resultado */}
            {resultado && (
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {resultado.registrosError > 0 ? (
                                <AlertTriangle size={20} className="text-yellow-500" />
                            ) : (
                                <CheckCircle2 size={20} className="text-green-500" />
                            )}
                            <h2 className="text-lg font-semibold">
                                Resultado del Proceso
                            </h2>
                        </div>
                        <StatusBadge
                            status={resultado.registrosError > 0 ? 'COMPLETADO_CON_ERRORES' : 'COMPLETADO'}
                        />
                    </div>
                    <div className="card-body space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-gray-500">Total Registros</p>
                                <p className="text-2xl font-bold text-gray-900">{resultado.totalRegistros}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-green-600">Procesados OK</p>
                                <p className="text-2xl font-bold text-green-700">{resultado.registrosOK}</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-red-600">Con Errores</p>
                                <p className="text-2xl font-bold text-red-700">{resultado.registrosError}</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-600">ID Proceso</p>
                                <p className="text-sm font-mono text-blue-700 truncate" title={resultado.idProceso}>
                                    {resultado.idProceso.substring(0, 12)}...
                                </p>
                            </div>
                        </div>

                        {/* Downloads */}
                        <div className="flex flex-wrap gap-4">
                            {resultado.urlTrama && (
                                <a
                                    href={resultado.urlTrama}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    Descargar Trama
                                </a>
                            )}
                            {resultado.urlErrores && (
                                <a
                                    href={resultado.urlErrores}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    Descargar Reporte Errores
                                </a>
                            )}
                        </div>

                        {/* Advertencias */}
                        {resultado.advertencias && resultado.advertencias.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="font-medium text-yellow-800 mb-2">Advertencias:</p>
                                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                                    {resultado.advertencias.map((adv, i) => (
                                        <li key={i}>{adv}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error state */}
            {procesarMutation.isError && !resultado && (
                <div className="card p-8 border-red-200 bg-red-50">
                    <div className="flex flex-col items-center gap-4">
                        <XCircle size={48} className="text-red-500" />
                        <div className="text-center">
                            <p className="text-lg font-medium text-red-900">Error en el procesamiento</p>
                            <p className="text-sm text-red-600">{procesarMutation.error?.message}</p>
                        </div>
                        <button onClick={handleReset} className="btn btn-secondary">
                            Intentar de nuevo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
