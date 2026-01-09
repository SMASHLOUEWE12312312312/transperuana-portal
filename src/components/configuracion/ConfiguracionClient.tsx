'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchConfig } from '@/lib/api';
import { ServerConfigResponse } from '@/lib/server-api';
import { cn } from '@/lib/utils';
import { useSmartPolling, POLLING_INTERVALS } from '@/hooks/useSmartPolling';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, FileText, Settings, Shield, Plus, Pencil, Trash2, RefreshCw, AlertTriangle, UserCog } from 'lucide-react';
import { UsuariosTab } from './UsuariosTab';

interface ConfigData {
    clientes: string[];
    companias: string[];
    plantillas: Record<string, { tiposSeguro: string[]; activo: boolean }>;
}

interface ConfiguracionClientProps {
    initialData: ServerConfigResponse | null;
}

export function ConfiguracionClient({ initialData }: ConfiguracionClientProps) {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const userRole = (session?.user as { role?: string })?.role || 'EJECUTIVO';
    const isAdmin = userRole === 'ADMIN';

    // Support URL query params for deep linking (e.g., /configuracion?tab=usuarios)
    const tabFromUrl = searchParams?.get('tab') as 'clientes' | 'plantillas' | 'sistema' | 'usuarios' | null;
    const [activeTab, setActiveTab] = useState<'clientes' | 'plantillas' | 'sistema' | 'usuarios'>(
        tabFromUrl && ['clientes', 'plantillas', 'sistema', 'usuarios'].includes(tabFromUrl) ? tabFromUrl : 'clientes'
    );

    // Update tab when URL changes
    useEffect(() => {
        if (tabFromUrl && ['clientes', 'plantillas', 'sistema', 'usuarios'].includes(tabFromUrl)) {
            // Use setTimeout to avoid synchronous state update warning
            const timer = setTimeout(() => {
                setActiveTab(prev => (prev !== tabFromUrl ? tabFromUrl : prev));
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [tabFromUrl]);

    // Polling inteligente (60s para config - menos crítico)
    const pollingInterval = useSmartPolling(POLLING_INTERVALS.CONFIG);

    // React Query
    const {
        data: configRaw,
        isRefetching,
        dataUpdatedAt,
        isError,
        refetch
    } = useQuery({
        queryKey: ['config'],
        queryFn: fetchConfig,
        initialData: initialData ? {
            ...initialData,
            success: true
        } : undefined,
        refetchInterval: pollingInterval,
        refetchOnMount: 'always',
        staleTime: 30000, // 30 segundos - menos activo
    });

    // Transform data
    const config = useMemo<ConfigData>(() => {
        if (!configRaw) return { clientes: [], companias: [], plantillas: {} };
        return {
            clientes: configRaw.clientes || [],
            companias: configRaw.companias || [],
            plantillas: configRaw.plantillas || {}
        };
    }, [configRaw]);

    const tabs = [
        { id: 'clientes' as const, label: 'Clientes', icon: <Users size={18} /> },
        { id: 'plantillas' as const, label: 'Plantillas', icon: <FileText size={18} /> },
        { id: 'sistema' as const, label: 'Sistema', icon: <Settings size={18} /> },
        // Usuarios tab - admin only
        ...(isAdmin ? [{ id: 'usuarios' as const, label: 'Usuarios', icon: <UserCog size={18} /> }] : [])
    ];

    // Handle error state
    if (isError && !config.clientes.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900">No se pudo cargar la configuración</h2>
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
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Shield size={20} className="text-gray-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                            {isRefetching && (
                                <RefreshCw size={16} className="animate-spin text-gray-400" />
                            )}
                        </div>
                        <p className="text-gray-500 text-sm">
                            Panel de administración del sistema
                            {dataUpdatedAt && (
                                <span className="ml-2 text-gray-400">
                                    · Actualizado {formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: es })}
                                </span>
                            )}
                        </p>
                    </div>
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

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-[#CD3529] text-[#CD3529]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'clientes' && (
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Clientes Configurados</h2>
                            <p className="text-sm text-gray-500">Clientes con mapeo de campos activo</p>
                        </div>
                        <button className="btn btn-primary btn-sm flex items-center gap-2">
                            <Plus size={16} />
                            Agregar Cliente
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="divide-y divide-gray-100">
                            {config.clientes.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No hay clientes configurados</p>
                            ) : (
                                config.clientes.map((cliente, index) => (
                                    <div key={index} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                                {cliente.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{cliente}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                                <Pencil size={16} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'plantillas' && (
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Plantillas por Compañía</h2>
                            <p className="text-sm text-gray-500">Configuración de mapeo de columnas</p>
                        </div>
                        <button className="btn btn-primary btn-sm flex items-center gap-2">
                            <Plus size={16} />
                            Nueva Plantilla
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {config.companias.map((compania) => {
                                const plantilla = config.plantillas[compania];
                                return (
                                    <div key={compania} className="card p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900">{compania}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${plantilla?.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {plantilla?.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-500">Tipos de seguro:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {plantilla?.tiposSeguro?.map((tipo) => (
                                                    <span key={tipo} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                        {tipo}
                                                    </span>
                                                )) || (
                                                        <span className="text-xs text-gray-400">Sin configurar</span>
                                                    )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button className="btn btn-ghost btn-sm flex-1">Editar</button>
                                            <button className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sistema' && (
                <div className="space-y-6">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold">Información del Sistema</h2>
                        </div>
                        <div className="card-body">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Versión del Portal</p>
                                    <p className="text-lg font-semibold text-gray-900">1.0.0</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">API Status</p>
                                    <p className="text-lg font-semibold text-green-600">✓ Conectado</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Clientes Configurados</p>
                                    <p className="text-lg font-semibold text-gray-900">{config.clientes.length}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Compañías Activas</p>
                                    <p className="text-lg font-semibold text-gray-900">{config.companias.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-lg font-semibold">Hojas del Sistema</h2>
                            <p className="text-sm text-gray-500">Hojas requeridas en el Spreadsheet</p>
                        </div>
                        <div className="card-body">
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    'BD_INTERMEDIA',
                                    'CONFIG_CLIENTES',
                                    'CONFIG_PLANTILLAS',
                                    'LOG_PROCESOS',
                                    'ERRORES_DETALLE',
                                    'BITACORA_CORREOS'
                                ].map((hoja) => (
                                    <div key={hoja} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <code className="text-sm text-gray-700">{hoja}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'usuarios' && (
                <UsuariosTab />
            )}
        </div>
    );
}
