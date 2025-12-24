import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

// =====================================================
// Utility Functions
// =====================================================

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, formatStr, { locale: es });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
}

/**
 * Format relative time (e.g., "hace 5 minutos")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

/**
 * Smart date format (Today at HH:mm, Yesterday at HH:mm, or full date)
 */
export function formatSmartDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isToday(d)) {
        return `Hoy a las ${format(d, 'HH:mm')}`;
    }

    if (isYesterday(d)) {
        return `Ayer a las ${format(d, 'HH:mm')}`;
    }

    return format(d, 'dd MMM yyyy, HH:mm', { locale: es });
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString('es-PE');
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}

/**
 * Generate UUID (for mock data)
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Get company color class
 */
export function getCompanyColorClass(compania: string): string {
    const colors: Record<string, string> = {
        'RIMAC': 'badge-rimac',
        'PACIFICO': 'badge-pacifico',
        'MAPFRE': 'badge-mapfre',
        'LA_POSITIVA': 'badge-positiva',
        'SANITAS': 'badge-sanitas'
    };
    return colors[compania] || 'badge-gray';
}

/**
 * Get status color class
 */
export function getStatusColorClass(estado: string): string {
    const colors: Record<string, string> = {
        'COMPLETADO': 'badge-success',
        'COMPLETADO_CON_ERRORES': 'badge-warning',
        'ERROR': 'badge-error',
        'EN_PROCESO': 'badge-info',
        'INICIADO': 'badge-gray'
    };
    return colors[estado] || 'badge-gray';
}

/**
 * Get error type color class
 */
export function getErrorTypeColorClass(tipoError: string): string {
    const colors: Record<string, string> = {
        'OBLIGATORIO': 'badge-error',
        'FORMATO': 'badge-warning',
        'VALIDACION': 'badge-warning',
        'LONGITUD': 'badge-info',
        'DUPLICADO': 'badge-gray'
    };
    return colors[tipoError] || 'badge-gray';
}

/**
 * Format company name for display
 */
export function formatCompanyName(compania: string): string {
    const names: Record<string, string> = {
        'RIMAC': 'Rímac',
        'PACIFICO': 'Pacífico',
        'MAPFRE': 'Mapfre',
        'LA_POSITIVA': 'La Positiva',
        'SANITAS': 'Sanitas'
    };
    return names[compania] || compania;
}

/**
 * Format status for display
 */
export function formatStatus(estado: string): string {
    const labels: Record<string, string> = {
        'COMPLETADO': 'Completado',
        'COMPLETADO_CON_ERRORES': 'Con Errores',
        'ERROR': 'Error',
        'EN_PROCESO': 'En Proceso',
        'INICIADO': 'Iniciado'
    };
    return labels[estado] || estado;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function (...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Calculate percentage change
 */
export function calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}
