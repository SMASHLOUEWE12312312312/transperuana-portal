/**
 * Server-side API functions
 * Optimizado para ISR (Incremental Static Regeneration)
 */

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

/**
 * Fetch optimizado para ISR
 * - Sin cache en memoria (Next.js maneja el cache)
 * - Con timeout para evitar builds lentos
 */
async function serverFetch<T>(action: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!APPS_SCRIPT_URL) {
        console.error('[Server API] APPS_SCRIPT_URL no configurada');
        return null;
    }

    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append('action', action);
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });

    try {
        console.log(`[Server API] Fetching: ${action}`);
        const startTime = Date.now();

        // AbortController para timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            // Cache de Next.js para ISR
            next: {
                revalidate: 60,
                tags: [action]
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        console.log(`[Server API] ${action} completado en ${duration}ms`);

        return data as T;
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

export async function getServerProcesos(limite = 100): Promise<ServerProcesosResponse | null> {
    return serverFetch<ServerProcesosResponse>('procesos', { limite: limite.toString() });
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
