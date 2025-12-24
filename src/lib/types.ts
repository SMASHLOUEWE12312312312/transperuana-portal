// =====================================================
// TypeScript Types - Portal de Monitoreo de Tramas
// Transperuana Corredores de Seguros S.A.
// =====================================================

// Enums based on backend constants
export type Compania = 'RIMAC' | 'PACIFICO' | 'MAPFRE' | 'LA_POSITIVA' | 'SANITAS';
export type TipoSeguro = 'SCTR' | 'VIDA_LEY';
export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE' | 'RUC' | 'PTP';

export type EstadoProceso =
    | 'INICIADO'
    | 'EN_PROCESO'
    | 'COMPLETADO'
    | 'COMPLETADO_CON_ERRORES'
    | 'ERROR';

export type EstadoRegistro = 'VALIDO' | 'ERROR' | 'ADVERTENCIA';

export type TipoError =
    | 'OBLIGATORIO'
    | 'FORMATO'
    | 'VALIDACION'
    | 'LONGITUD'
    | 'DUPLICADO';

// User & Auth
export interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: 'ADMIN' | 'EJECUTIVO';
}

// LOG_PROCESOS structure
export interface Proceso {
    idProceso: string;
    fechaHoraProceso: Date;
    usuario: string;
    cliente: string;
    compania: Compania;
    tipoSeguro: TipoSeguro;
    archivoOrigenNombre: string;
    archivoOrigenId: string;
    registrosTotales: number;
    registrosOK: number;
    registrosConError: number;
    tramaGeneradaId: string | null;
    tramaGeneradaUrl: string | null;
    reporteErroresId: string | null;
    reporteErroresUrl: string | null;
    estado: EstadoProceso;
    mensajeDetalle: string;
    duracionSegundos: number;
}

// ERRORES_DETALLE structure
export interface ErrorDetalle {
    idProceso: string;
    fechaHora: Date;
    filaOriginal: number;
    campo: string;
    valorOriginal: string;
    tipoError: TipoError;
    descripcionError: string;
}

// BITACORA_CORREOS structure
export interface BitacoraCorreo {
    timestamp: Date;
    messageId: string;
    threadId: string;
    subject: string;
    sender: string;
    attachmentName: string;
    attachmentType: string;
    companiaDetectada: Compania | null;
    tipoSeguroDetectado: TipoSeguro | null;
    confidenceScore: number;
    detectionMethod: string;
    labelRoute: string;
    fileIdRaw: string | null;
    fileIdReady: string | null;
    processingResult: 'PENDIENTE' | 'PROCESADO' | 'ERROR' | 'IGNORADO';
    idProceso: string | null;
    errorDetail: string | null;
    processingTime: number;
}

// BD_INTERMEDIA record (simplified for display)
export interface RegistroBD {
    idProceso: string;
    fechaProceso: Date;
    cliente: string;
    compania: Compania;
    tipoSeguro: TipoSeguro;
    tipoDocumento: TipoDocumento;
    numeroDocumento: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    primerNombre: string;
    segundoNombre?: string;
    nombreCompleto: string;
    fechaNacimiento: Date;
    fechaIngreso?: Date;
    moneda: 'PEN' | 'USD';
    remuneracion: number;
    estado: EstadoRegistro;
    filaOriginal: number;
}

// Dashboard Types
export interface KPIStats {
    procesosHoy: number;
    procesosTendencia: number; // porcentaje vs ayer
    registrosProcesados: number;
    registrosTendencia: number;
    tasaExito: number;
    tasaExitoTendencia: number;
    tiempoPromedio: number;
    tiempoPromedioTendencia: number;
}

export interface ChartDataPoint {
    fecha: string;
    procesos: number;
    exitosos: number;
    errores: number;
}

export interface CompaniaDistribution {
    compania: Compania;
    cantidad: number;
    porcentaje: number;
}

export interface ErrorTypeDistribution {
    tipoError: TipoError;
    cantidad: number;
    porcentaje: number;
}

export interface ActivityItem {
    id: string;
    tipo: 'proceso' | 'error' | 'correo';
    titulo: string;
    descripcion: string;
    timestamp: Date;
    estado: EstadoProceso | 'INFO';
    link?: string;
}

export interface Alert {
    id: string;
    tipo: 'warning' | 'error' | 'info' | 'success';
    titulo: string;
    descripcion: string;
    timestamp: Date;
    dismissible: boolean;
    link?: string;
}

// Filter Types
export interface ProcesosFilters {
    fechaDesde?: Date;
    fechaHasta?: Date;
    cliente?: string;
    compania?: Compania;
    tipoSeguro?: TipoSeguro;
    estado?: EstadoProceso;
    busqueda?: string;
    page: number;
    pageSize: number;
}

export interface ErroresFilters {
    idProceso?: string;
    campo?: string;
    tipoError?: TipoError;
    page: number;
    pageSize: number;
}

export interface BitacoraFilters {
    fechaDesde?: Date;
    fechaHasta?: Date;
    sender?: string;
    processingResult?: BitacoraCorreo['processingResult'];
    page: number;
    pageSize: number;
}

// Pagination
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Config Types
export interface ConfigPlantilla {
    id: number;
    compania: Compania;
    tipoSeguro: TipoSeguro;
    columnaDestino: string;
    campoInternoBD: string;
    formatoSalida?: string;
    reglaEspecial?: string;
    activo: boolean;
}

export interface SystemLog {
    id: string;
    timestamp: Date;
    nivel: 'INFO' | 'WARNING' | 'ERROR';
    modulo: string;
    mensaje: string;
    detalles?: Record<string, unknown>;
}

// Download Types
export interface DescargaItem {
    id: string;
    idProceso: string;
    tipo: 'trama' | 'errores';
    nombreArchivo: string;
    compania: Compania;
    tipoSeguro: TipoSeguro;
    fechaGeneracion: Date;
    url: string;
    tamanio: number; // bytes
}
