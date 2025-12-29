import {
    Proceso,
    ErrorDetalle,
    BitacoraCorreo,
    KPIStats,
    ChartDataPoint,
    CompaniaDistribution,
    ErrorTypeDistribution,
    ActivityItem,
    Alert,
    Compania,
    TipoSeguro,
    EstadoProceso,
    TipoError,
    DescargaItem
} from './types';
import { generateUUID } from './utils';
import { subDays, subHours, subMinutes } from 'date-fns';

// =====================================================
// Mock Data Generators
// =====================================================

const COMPANIAS: Compania[] = ['RIMAC', 'PACIFICO', 'MAPFRE', 'LA_POSITIVA', 'SANITAS'];
const TIPOS_SEGURO: TipoSeguro[] = ['SCTR', 'VIDA_LEY'];
const ESTADOS: EstadoProceso[] = ['COMPLETADO', 'COMPLETADO_CON_ERRORES', 'ERROR', 'EN_PROCESO', 'INICIADO'];
const TIPOS_ERROR: TipoError[] = ['OBLIGATORIO', 'FORMATO', 'VALIDACION', 'LONGITUD', 'DUPLICADO'];

const CLIENTES = [
    'CORPORACION ACEROS AREQUIPA',
    'GRUPO GLORIA',
    'ALICORP',
    'BACKUS',
    'CEMENTOS PACASMAYO',
    'SOUTHERN PERU',
    'ANTAMINA',
    'VOLCAN',
    'FERREYROS',
    'LINDLEY'
];

const CAMPOS_ERROR = [
    'NumeroDocumento',
    'FechaNacimiento',
    'Remuneracion',
    'ApellidoPaterno',
    'TipoDocumento',
    'Correo',
    'Telefono',
    'Sexo',
    'EstadoCivil'
];

const USUARIOS = [
    'jperez@transperuana.com.pe',
    'mgarcia@transperuana.com.pe',
    'alopez@transperuana.com.pe',
    'rcastro@transperuana.com.pe'
];

// Random helpers
function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate mock processes
export function generateMockProcesos(count: number = 50): Proceso[] {
    const procesos: Proceso[] = [];

    for (let i = 0; i < count; i++) {
        const registrosTotales = randomInt(50, 500);
        const registrosConError = randomInt(0, Math.floor(registrosTotales * 0.15));
        const registrosOK = registrosTotales - registrosConError;

        const hasErrors = registrosConError > 0;
        const isFailed = Math.random() < 0.05;

        let estado: EstadoProceso;
        if (isFailed) {
            estado = 'ERROR';
        } else if (hasErrors) {
            estado = 'COMPLETADO_CON_ERRORES';
        } else {
            estado = 'COMPLETADO';
        }

        // Recent processes might be in progress
        if (i < 3 && Math.random() < 0.3) {
            estado = randomItem(['EN_PROCESO', 'INICIADO']);
        }

        const compania = randomItem(COMPANIAS);
        const tipoSeguro = randomItem(TIPOS_SEGURO);
        const cliente = randomItem(CLIENTES);
        const idProceso = generateUUID();

        procesos.push({
            idProceso,
            fechaHoraProceso: subMinutes(new Date(), randomInt(0, 60 * 24 * 30)), // Last 30 days
            usuario: randomItem(USUARIOS),
            cliente,
            compania,
            tipoSeguro,
            archivoOrigenNombre: `${cliente.replace(/\s+/g, '_')}_${tipoSeguro}_${new Date().toISOString().slice(0, 7)}.xlsx`,
            archivoOrigenId: `file_${generateUUID().slice(0, 8)}`,
            registrosTotales,
            registrosOK,
            registrosConError,
            tramaGeneradaId: estado === 'COMPLETADO' || estado === 'COMPLETADO_CON_ERRORES' ? `trama_${idProceso.slice(0, 8)}` : null,
            tramaGeneradaUrl: estado === 'COMPLETADO' || estado === 'COMPLETADO_CON_ERRORES'
                ? `https://docs.google.com/spreadsheets/d/${generateUUID()}/export?format=xlsx`
                : null,
            reporteErroresId: hasErrors ? `errores_${idProceso.slice(0, 8)}` : null,
            reporteErroresUrl: hasErrors
                ? `https://docs.google.com/spreadsheets/d/${generateUUID()}/export?format=xlsx`
                : null,
            estado,
            mensajeDetalle: getMensajeDetalle(estado, registrosOK, registrosConError),
            duracionSegundos: randomFloat(2, 45, 1)
        });
    }

    // Sort by date descending
    return procesos.sort((a, b) => b.fechaHoraProceso.getTime() - a.fechaHoraProceso.getTime());
}

function getMensajeDetalle(estado: EstadoProceso, ok: number, errores: number): string {
    switch (estado) {
        case 'COMPLETADO':
            return `Proceso completado exitosamente. ${ok} registros procesados.`;
        case 'COMPLETADO_CON_ERRORES':
            return `Proceso completado con ${errores} errores. ${ok} registros válidos.`;
        case 'ERROR':
            return 'Error crítico durante el procesamiento. Revisar archivo origen.';
        case 'EN_PROCESO':
            return 'Procesando registros...';
        case 'INICIADO':
            return 'Proceso iniciado, esperando ejecución.';
        default:
            return '';
    }
}

// Generate mock errors
export function generateMockErrores(idProceso: string, count: number = 10): ErrorDetalle[] {
    const errores: ErrorDetalle[] = [];

    for (let i = 0; i < count; i++) {
        const tipoError = randomItem(TIPOS_ERROR);
        const campo = randomItem(CAMPOS_ERROR);

        errores.push({
            idProceso,
            fechaHora: subMinutes(new Date(), randomInt(0, 60)),
            filaOriginal: randomInt(2, 500),
            campo,
            valorOriginal: getValorOriginalPorCampo(campo),
            tipoError,
            descripcionError: getDescripcionError(tipoError, campo)
        });
    }

    return errores.sort((a, b) => a.filaOriginal - b.filaOriginal);
}

function getValorOriginalPorCampo(campo: string): string {
    const valores: Record<string, string[]> = {
        'NumeroDocumento': ['1234567', '123456789', 'A12345678', ''],
        'FechaNacimiento': ['32/13/1990', '1990-13-32', 'abc', ''],
        'Remuneracion': ['-1500', 'mil', '', 'abc'],
        'ApellidoPaterno': ['', '123', 'García#$'],
        'TipoDocumento': ['DNI123', 'X', '', 'CEDULA'],
        'Correo': ['correo', 'user@', '@domain.com', ''],
        'Telefono': ['123', '+51-999-abc', ''],
        'Sexo': ['X', '3', 'Otro', ''],
        'EstadoCivil': ['X', '9', '', 'SEPARADO']
    };
    return randomItem(valores[campo] || ['valor_invalido']);
}

function getDescripcionError(tipo: TipoError, campo: string): string {
    const descripciones: Record<TipoError, string> = {
        'OBLIGATORIO': `El campo ${campo} es obligatorio y está vacío`,
        'FORMATO': `El campo ${campo} tiene un formato inválido`,
        'VALIDACION': `El valor del campo ${campo} no cumple las reglas de validación`,
        'LONGITUD': `El campo ${campo} excede la longitud permitida`,
        'DUPLICADO': `Se encontró un registro duplicado en ${campo}`
    };
    return descripciones[tipo];
}

// Generate mock bitácora
export function generateMockBitacora(count: number = 30): BitacoraCorreo[] {
    const bitacora: BitacoraCorreo[] = [];

    for (let i = 0; i < count; i++) {
        const hasProcess = Math.random() > 0.2;
        const compania = randomItem(COMPANIAS);
        const tipoSeguro = randomItem(TIPOS_SEGURO);

        bitacora.push({
            timestamp: subHours(new Date(), randomInt(0, 72)),
            messageId: `msg_${generateUUID().slice(0, 12)}`,
            threadId: `thread_${generateUUID().slice(0, 8)}`,
            subject: `Trama ${tipoSeguro} - ${randomItem(CLIENTES)} - ${new Date().toISOString().slice(0, 7)}`,
            sender: `${['rrhh', 'nominas', 'planillas', 'seguros'][randomInt(0, 3)]}@${randomItem(CLIENTES).toLowerCase().replace(/\s+/g, '')}.com.pe`,
            attachmentName: `nomina_${tipoSeguro.toLowerCase()}_${new Date().toISOString().slice(0, 7)}.xlsx`,
            attachmentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            companiaDetectada: hasProcess ? compania : null,
            tipoSeguroDetectado: hasProcess ? tipoSeguro : null,
            confidenceScore: hasProcess ? randomFloat(0.75, 0.99, 2) : 0,
            detectionMethod: hasProcess ? randomItem(['SUBJECT_PATTERN', 'ATTACHMENT_NAME', 'SENDER_DOMAIN', 'CONTENT_ANALYSIS']) : 'NONE',
            labelRoute: hasProcess ? `ETL/${compania}/${tipoSeguro}` : 'ETL/PENDIENTE',
            fileIdRaw: `raw_${generateUUID().slice(0, 8)}`,
            fileIdReady: hasProcess ? `ready_${generateUUID().slice(0, 8)}` : null,
            processingResult: hasProcess ? randomItem(['PROCESADO', 'ERROR']) : randomItem(['PENDIENTE', 'IGNORADO']),
            idProceso: hasProcess ? generateUUID() : null,
            errorDetail: !hasProcess || Math.random() < 0.1 ? 'No se pudo detectar compañía/tipo de seguro' : null,
            processingTime: randomFloat(1, 15, 1)
        });
    }

    return bitacora.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
}

// Generate dashboard stats
export function generateMockKPIStats(): KPIStats {
    return {
        procesosHoy: randomInt(15, 45),
        procesosTendencia: randomFloat(-15, 25, 1),
        registrosProcesados: randomInt(8000, 15000),
        registrosTendencia: randomFloat(-10, 20, 1),
        tasaExito: randomFloat(92, 98, 1),
        tasaExitoTendencia: randomFloat(-2, 5, 1),
        tiempoPromedio: randomFloat(5, 12, 1),
        tiempoPromedioTendencia: randomFloat(-20, 10, 1)
    };
}

// Generate chart data
export function generateMockChartData(days: number = 30): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const procesos = randomInt(10, 50);
        const errores = randomInt(0, Math.floor(procesos * 0.15));

        data.push({
            fecha: date.toISOString().slice(0, 10),
            procesos,
            exitosos: procesos - errores,
            errores
        });
    }

    return data;
}

// Generate company distribution
export function generateMockCompaniaDistribution(): CompaniaDistribution[] {
    const totals = COMPANIAS.map(compania => ({
        compania,
        cantidad: randomInt(50, 300)
    }));

    const total = totals.reduce((sum, item) => sum + item.cantidad, 0);

    return totals.map(item => ({
        ...item,
        porcentaje: parseFloat(((item.cantidad / total) * 100).toFixed(1))
    })).sort((a, b) => b.cantidad - a.cantidad);
}

// Generate error type distribution
export function generateMockErrorDistribution(): ErrorTypeDistribution[] {
    const totals = TIPOS_ERROR.map(tipoError => ({
        tipoError,
        cantidad: randomInt(10, 100)
    }));

    const total = totals.reduce((sum, item) => sum + item.cantidad, 0);

    return totals.map(item => ({
        ...item,
        porcentaje: parseFloat(((item.cantidad / total) * 100).toFixed(1))
    })).sort((a, b) => b.cantidad - a.cantidad);
}

// Generate activity items
export function generateMockActivity(count: number = 10): ActivityItem[] {
    const activities: ActivityItem[] = [];

    for (let i = 0; i < count; i++) {
        const tipo = randomItem(['proceso', 'correo', 'error'] as const);
        const estado = randomItem(ESTADOS);

        let titulo: string;
        let descripcion: string;

        switch (tipo) {
            case 'proceso':
                titulo = `Proceso ${estado.toLowerCase().replace('_', ' ')}`;
                descripcion = `${randomItem(CLIENTES)} - ${randomItem(COMPANIAS)} ${randomItem(TIPOS_SEGURO)}`;
                break;
            case 'correo':
                titulo = 'Correo recibido';
                descripcion = `Nueva trama de ${randomItem(CLIENTES)}`;
                break;
            case 'error':
                titulo = 'Error detectado';
                descripcion = `${randomInt(1, 10)} errores en proceso de ${randomItem(CLIENTES)}`;
                break;
        }

        activities.push({
            id: generateUUID(),
            tipo,
            titulo,
            descripcion,
            timestamp: subMinutes(new Date(), randomInt(0, 120)),
            estado: tipo === 'error' ? 'ERROR' : estado,
            link: `/procesos/${generateUUID()}`
        });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate alerts
export function generateMockAlerts(): Alert[] {
    return [
        {
            id: '1',
            tipo: 'warning',
            titulo: '3 procesos con errores pendientes',
            descripcion: 'Hay procesos que requieren revisión manual',
            timestamp: subMinutes(new Date(), 15),
            dismissible: true,
            link: '/procesos?estado=ERROR'
        },
        {
            id: '2',
            tipo: 'success',
            titulo: 'Sistema operativo',
            descripcion: 'Último proceso completado hace 5 minutos',
            timestamp: subMinutes(new Date(), 5),
            dismissible: false
        }
    ];
}

// Generate downloads
export function generateMockDescargas(count: number = 20): DescargaItem[] {
    const descargas: DescargaItem[] = [];

    for (let i = 0; i < count; i++) {
        const idProceso = generateUUID();
        const compania = randomItem(COMPANIAS);
        const tipoSeguro = randomItem(TIPOS_SEGURO);
        const tipo = randomItem(['trama', 'errores'] as const);

        descargas.push({
            id: generateUUID(),
            idProceso,
            tipo,
            nombreArchivo: tipo === 'trama'
                ? `TRAMA_${compania}_${tipoSeguro}_${new Date().toISOString().slice(0, 10)}.xlsx`
                : `ERRORES_${idProceso.slice(0, 8)}.xlsx`,
            compania,
            tipoSeguro,
            fechaGeneracion: subHours(new Date(), randomInt(0, 72)),
            url: `https://docs.google.com/spreadsheets/d/${generateUUID()}/export?format=xlsx`,
            tamanio: randomInt(10000, 500000)
        });
    }

    return descargas.sort((a, b) => b.fechaGeneracion.getTime() - a.fechaGeneracion.getTime());
}

// Export singleton instances for consistent data across components
export const mockProcesos = generateMockProcesos(100);
export const mockBitacora = generateMockBitacora(50);
export const mockKPIStats = generateMockKPIStats();
export const mockChartData = generateMockChartData(30);
export const mockCompaniaDistribution = generateMockCompaniaDistribution();
export const mockErrorDistribution = generateMockErrorDistribution();
export const mockActivity = generateMockActivity(15);
export const mockAlerts = generateMockAlerts();
export const mockDescargas = generateMockDescargas(30);
