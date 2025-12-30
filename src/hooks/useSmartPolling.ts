'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para polling inteligente que pausa cuando la pestaña está oculta
 * Evita requests innecesarios y ahorra recursos
 * 
 * @param baseInterval - Intervalo base en ms (ej: 5000 para 5s)
 * @returns intervalo actual (false cuando tab hidden = polling pausado)
 */
export function useSmartPolling(baseInterval: number): number | false {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleVisibility = () => {
            setIsVisible(document.visibilityState === 'visible');
        };

        // Check initial state
        handleVisibility();

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    return isVisible ? baseInterval : false;
}

/**
 * Intervalos de polling por módulo (en ms)
 * - Activos (Bitácora, Procesos): 5 segundos
 * - Dashboard: 15 segundos
 * - Menos críticos: 30-60 segundos
 */
export const POLLING_INTERVALS = {
    BITACORA: 5000,
    PROCESOS: 5000,
    DASHBOARD: 15000,
    ERRORES: 30000,
    DESCARGAS: 30000,
    CONFIG: 60000,
} as const;
