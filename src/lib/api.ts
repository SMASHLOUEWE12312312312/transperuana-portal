/**
 * API Service para el Portal de Monitoreo ETL
 * Conecta con Google Apps Script a través del proxy local
 * 
 * Versión: 2.0 - Con API Route Proxy (sin problemas CORS)
 */

// URL del proxy local - siempre disponible en el mismo dominio
const API_PROXY_URL = '/api/apps-script';
import { logger } from './logger';

// Flag para usar mock data (solo si explícitamente deshabilitado)
const FORCE_MOCK_DATA = process.env.NEXT_PUBLIC_FORCE_MOCK === 'true';

/**
 * Función genérica para llamar a la API
 * Usa el proxy local para evitar CORS
 */
async function callAPI<T>(action: string, params: Record<string, string> = {}): Promise<T> {
    if (FORCE_MOCK_DATA) {
        console.warn(`[API] Mock data forzado para: ${action}`);
        throw new Error('MOCK_MODE');
    }

    // Construir URL con parámetros
    const url = new URL(API_PROXY_URL, window.location.origin);
    url.searchParams.append('action', action);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value);
        }
    });

    try {
        logger.info(`[API] Llamando: ${action}`);
        const startTime = performance.now();

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const duration = Math.round(performance.now() - startTime);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error en la respuesta de la API');
        }

        logger.info(`[API] ${action} exitoso (${duration}ms)`);
        return data as T;

    } catch (error) {
        console.error(`[API] Error en ${action}:`, error);
        throw error;
    }
}

// ========================================================
// TIPOS DE RESPUESTA
// ========================================================

export interface DashboardResponse {
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

export interface ProcesosResponse {
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

export interface ProcesoDetalleResponse {
    success: boolean;
    proceso: ProcesosResponse['procesos'][0];
    errores: Array<{
        idProceso: string;
        fechaHora: string;
        filaOriginal: number;
        campo: string;
        valorOriginal: string;
        tipoError: string;
        descripcionError: string;
    }>;
}

export interface ErroresResponse {
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

export interface BitacoraResponse {
    success: boolean;
    bitacora: Array<Record<string, unknown>>;
    total: number;
}

export interface DescargasResponse {
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

export interface ConfigResponse {
    success: boolean;
    clientes: string[];
    companias: string[];
    plantillas: Record<string, {
        tiposSeguro: string[];
        activo: boolean;
    }>;
}

// ========================================================
// FUNCIONES DE API
// ========================================================

/**
 * Obtiene datos del dashboard (KPIs, charts, actividad)
 */
export async function fetchDashboard(): Promise<DashboardResponse> {
    return callAPI<DashboardResponse>('dashboard');
}

/**
 * Obtiene lista de procesos con filtros opcionales
 */
export async function fetchProcesos(params?: {
    limite?: number;
    compania?: string;
    tipoSeguro?: string;
    estado?: string;
    cliente?: string;
    search?: string;
    ownerEmail?: string;
}): Promise<ProcesosResponse> {
    return callAPI<ProcesosResponse>('procesos', {
        limite: params?.limite?.toString() || '100',
        compania: params?.compania || '',
        tipoSeguro: params?.tipoSeguro || '',
        estado: params?.estado || '',
        cliente: params?.cliente || '',
        search: params?.search || '',
        ownerEmail: params?.ownerEmail || 'ALL'
    });
}

/**
 * Obtiene detalle de un proceso específico
 */
export async function fetchProcesoDetalle(idProceso: string): Promise<ProcesoDetalleResponse> {
    return callAPI<ProcesoDetalleResponse>('proceso', { id: idProceso });
}

/**
 * Obtiene lista de errores con filtros
 */
export async function fetchErrores(params?: {
    limite?: number;
    tipoError?: string;
    idProceso?: string;
    search?: string;
}): Promise<ErroresResponse> {
    return callAPI<ErroresResponse>('errores', {
        limite: params?.limite?.toString() || '500',
        tipoError: params?.tipoError || '',
        idProceso: params?.idProceso || '',
        search: params?.search || ''
    });
}

/**
 * Obtiene bitácora de correos
 */
export async function fetchBitacora(params?: {
    limite?: number;
    estado?: string;
    search?: string;
}): Promise<BitacoraResponse> {
    return callAPI<BitacoraResponse>('bitacora', {
        limite: params?.limite?.toString() || '100',
        estado: params?.estado || '',
        search: params?.search || ''
    });
}

/**
 * Obtiene lista de descargas
 */
export async function fetchDescargas(params?: {
    compania?: string;
    tipoSeguro?: string;
    tipo?: string;
}): Promise<DescargasResponse> {
    return callAPI<DescargasResponse>('descargas', {
        compania: params?.compania || '',
        tipoSeguro: params?.tipoSeguro || '',
        tipo: params?.tipo || ''
    });
}

/**
 * Obtiene configuración del sistema
 */
export async function fetchConfig(): Promise<ConfigResponse> {
    return callAPI<ConfigResponse>('config');
}

/**
 * Obtiene lista de clientes
 */
export async function fetchClientes(): Promise<{ clientes: string[] }> {
    return callAPI<{ clientes: string[] }>('clientes');
}

/**
 * Obtiene lista de compañías
 */
export async function fetchCompanias(): Promise<{ companias: string[] }> {
    return callAPI<{ companias: string[] }>('companias');
}

/**
 * Verifica si la API está disponible
 */
export async function pingAPI(): Promise<boolean> {
    try {
        const result = await callAPI<{ success: boolean; message: string }>('ping');
        return result.success;
    } catch {
        return false;
    }
}

/**
 * Indica si estamos usando mock data forzado
 */
export function isUsingMockData(): boolean {
    return FORCE_MOCK_DATA;
}
