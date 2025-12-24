/**
 * API Service para conectar con Google Apps Script Web App
 * 
 * INSTRUCCIONES:
 * 1. Copia el archivo 18_WebAppAPI.js a tu proyecto de Apps Script
 * 2. Implementa como Web App (Implementar > Nueva implementación > Aplicación web)
 * 3. Configura: Ejecutar como "Yo", Acceso "Cualquier persona"
 * 4. Copia la URL generada y actualiza APPS_SCRIPT_URL abajo
 */

// URL de la Web App de Apps Script
// IMPORTANTE: Reemplazar con tu URL real después de implementar
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';

// Flag para usar mock data mientras no hay URL configurada
const USE_MOCK_DATA = !APPS_SCRIPT_URL;

/**
 * Función genérica para llamar a la API
 * IMPORTANTE: No usar headers personalizados para evitar CORS preflight
 */
async function callAPI<T>(action: string, params: Record<string, string> = {}): Promise<T> {
    if (USE_MOCK_DATA) {
        console.warn(`[API] Sin URL configurada, usando mock data para: ${action}`);
        throw new Error('MOCK_MODE');
    }

    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append('action', action);

    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });

    try {
        console.log(`[API] Llamando: ${action}`);

        // IMPORTANTE: No usar headers personalizados con Apps Script
        // Solo peticiones GET simples funcionan sin CORS preflight
        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow', // Apps Script hace redirect, debemos seguirlo
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error en la API');
        }

        console.log(`[API] ${action} exitoso`);
        return data as T;
    } catch (error) {
        console.error(`[API] Error llamando a ${action}:`, error);
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
}): Promise<ProcesosResponse> {
    return callAPI<ProcesosResponse>('procesos', {
        limite: params?.limite?.toString() || '100',
        compania: params?.compania || '',
        tipoSeguro: params?.tipoSeguro || '',
        estado: params?.estado || '',
        cliente: params?.cliente || '',
        search: params?.search || ''
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
        await callAPI<{ success: boolean }>('ping');
        return true;
    } catch {
        return false;
    }
}

/**
 * Indica si estamos en modo mock
 */
export function isUsingMockData(): boolean {
    return USE_MOCK_DATA;
}
