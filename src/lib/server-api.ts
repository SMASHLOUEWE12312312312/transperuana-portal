/**
 * Server-side API functions
 * Optimizado para ISR (Incremental Static Regeneration)
 * 
 * COMMIT 1: SSR ahora usa el proxy interno /api/apps-script
 * para consistencia con CSR y seguridad centralizada
 */

import { headers } from 'next/headers';
import { logger } from './logger';

// Proxy interno - mismo que usa el cliente
const API_PROXY_URL = '/api/apps-script';

type ServerFetchOptions = { userScoped?: boolean };

/**
 * Obtiene la URL base para SSR de forma robusta
 * Prioridad: NEXTAUTH_URL > headers de runtime > localhost
 */
async function getProxyBaseUrl(): Promise<string> {
    // 1. Preferir NEXTAUTH_URL (producción configurada)
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // 2. Derivar de headers en runtime (SSR robusto)
    try {
        const headersList = await headers();
        const proto = headersList.get('x-forwarded-proto') || 'https';
        const host = headersList.get('x-forwarded-host') || headersList.get('host');
        if (host) {
            return `${proto}://${host}`;
        }
    } catch {
        // headers() puede fallar fuera de request context (build time)
    }

    // 3. Fallback para desarrollo local
    return 'http://localhost:3000';
}

/**
 * Fetch optimizado para ISR - ahora usa proxy interno
 * - Sin cache en memoria (Next.js maneja el cache)
 * - Con timeout para evitar builds lentos
 * - userScoped=true usa no-store (sin cache) para datos por usuario
 */
async function serverFetch<T>(
    action: string,
    params: Record<string, string> = {},
    options: ServerFetchOptions = {}
): Promise<T | null> {
    // Construir URL usando el proxy interno
    const baseUrl = await getProxyBaseUrl();
    const url = new URL(`${baseUrl}${API_PROXY_URL}`);
    url.searchParams.append('action', action);
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });

    try {
        logger.info(`[Server API] Fetching via proxy: ${action}`);
        const startTime = Date.now();

        // AbortController para timeout de 15 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const userScoped = Boolean(options.userScoped);

        // Determinar estrategia de revalidación
        const REALTIME_ACTIONS = ['dashboard', 'procesos', 'bitacora', 'errores', 'descargas', 'alertas', 'proceso'];
        const isRealtime = REALTIME_ACTIONS.includes(action);

        // ISR: 15s para realtime, 60s para config
        // userScoped siempre usa no-store sin revalidate
        const revalidateSeconds = isRealtime ? 15 : 60;

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            cache: 'no-store',  // Siempre no-store para datos frescos
            next: userScoped
                ? undefined
                : { revalidate: revalidateSeconds, tags: [action, 'api'] }
        });


        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }

        const text = await response.text();
        let data: T;
        if (text.trim().startsWith('<')) {
            console.warn(`[Server API] Received HTML instead of JSON from ${action}:`, text.substring(0, 200));
            return null;
        }

        try {
            data = JSON.parse(text);
        } catch (jsonError) {
            console.error(`[Server API] Invalid JSON response from ${action}:`, jsonError, text.substring(0, 200));
            return null;
        }

        const duration = Date.now() - startTime;
        logger.info(`[Server API] ${action} completado en ${duration}ms (ISR: ${userScoped ? 'disabled' : revalidateSeconds + 's'})`);

        return data;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error(`[Server API] Timeout en ${action}`);
        } else {
            console.error(`[Server API] Error en ${action}:`, error);
        }
        return null;
    }
}

// Type definitions
export interface ServerDashboardResponse {
    success: boolean;
    kpis: {
        procesosHoy: number;
        procesosTendencia: number;
        registrosProcesados: number;
        registrosTendencia: number;
        tasaExito: number;
        tasaExitoTendencia: number;
        tiempoPromedio: number;
        tiempoPromedioTendencia: number;
    };
    chartData: Array<{
        fecha: string;
        procesos: number;
        registros: number;
        errores: number;
    }>;
    companiaDistribution: Array<{
        compania: string;
        cantidad: number;
        porcentaje: string;
    }>;
    errorDistribution: Array<{
        tipoError: string;
        cantidad: number;
    }>;
    actividadReciente: Array<{
        id: string;
        tipo: string;
        titulo: string;
        descripcion: string;
        estado: string;
        timestamp: string;
    }>;
}

export interface ServerProcesosResponse {
    success: boolean;
    procesos: Array<{
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
    }>;
    total: number;
}

export interface ServerErroresResponse {
    success: boolean;
    errores: Array<{
        idProceso: string;
        fechaHora: string;
        filaOriginal: number;
        campo: string;
        valorOriginal: string;
        tipoError: string;
        descripcionError: string;
    }>;
    total: number;
}

export interface ServerBitacoraResponse {
    success: boolean;
    bitacora: Array<Record<string, unknown>>;
    total: number;
}

export interface ServerDescargasResponse {
    success: boolean;
    descargas: Array<{
        id: string;
        tipo: 'trama' | 'errores';
        nombreArchivo: string;
        compania: string;
        tipoSeguro: string;
        fechaGeneracion: string;
        idProceso: string;
        url: string;
        tamanio: number | null;
    }>;
    total: number;
}

export interface ServerConfigResponse {
    success: boolean;
    clientes: string[];
    companias: string[];
    plantillas: Record<string, {
        tiposSeguro: string[];
        activo: boolean;
    }>;
}

// API functions
export async function getServerDashboard(): Promise<ServerDashboardResponse | null> {
    return serverFetch<ServerDashboardResponse>('dashboard');
}

export async function getServerProcesos(limite = 100, ownerEmail = 'ALL'): Promise<ServerProcesosResponse | null> {
    const userScoped = Boolean(ownerEmail && ownerEmail !== 'ALL');
    return serverFetch<ServerProcesosResponse>(
        'procesos',
        { limite: limite.toString(), ownerEmail },
        { userScoped }
    );
}

export async function getServerErrores(limite = 500): Promise<ServerErroresResponse | null> {
    return serverFetch<ServerErroresResponse>('errores', { limite: limite.toString() });
}

export async function getServerBitacora(limite = 100): Promise<ServerBitacoraResponse | null> {
    return serverFetch<ServerBitacoraResponse>('bitacora', { limite: limite.toString() });
}

export async function getServerDescargas(): Promise<ServerDescargasResponse | null> {
    return serverFetch<ServerDescargasResponse>('descargas');
}

export async function getServerConfig(): Promise<ServerConfigResponse | null> {
    return serverFetch<ServerConfigResponse>('config');
}
