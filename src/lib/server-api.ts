/**
 * Server-side API functions
 * Solo para uso en Server Components y API Routes
 * NO hay problemas CORS porque las llamadas se hacen server-to-server
 */

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

interface CacheEntry {
    data: unknown;
    timestamp: number;
}

// Cache en memoria del servidor (persiste entre requests en el mismo proceso)
const serverCache = new Map<string, CacheEntry>();
const SERVER_CACHE_TTL = 30000; // 30 segundos

/**
 * Fetch con cache server-side
 */
async function serverFetch<T>(action: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!APPS_SCRIPT_URL) {
        console.error('[Server API] APPS_SCRIPT_URL no configurada');
        return null;
    }

    // Construir URL
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append('action', action);
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });

    const cacheKey = url.toString();

    // Verificar cache
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SERVER_CACHE_TTL) {
        console.log(`[Server API] Cache HIT: ${action}`);
        return cached.data as T;
    }

    try {
        console.log(`[Server API] Fetching: ${action}`);
        const startTime = Date.now();

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow',
            // Next.js fetch cache
            next: { revalidate: 30 }
        });

        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        console.log(`[Server API] ${action} completado en ${duration}ms`);

        if (data.success) {
            serverCache.set(cacheKey, { data, timestamp: Date.now() });
        }

        return data as T;
    } catch (error) {
        console.error(`[Server API] Error en ${action}:`, error);
        return null;
    }
}

// ========================================================
// TIPOS
// ========================================================

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

// ========================================================
// FUNCIONES EXPORTADAS
// ========================================================

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
