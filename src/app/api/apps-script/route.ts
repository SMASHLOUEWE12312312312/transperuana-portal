/**
 * API Route Proxy para Google Apps Script
 * Elimina problemas CORS al actuar como intermediario server-side
 */
import { NextRequest, NextResponse } from 'next/server';

// URL del Apps Script (variable de entorno del servidor, NO pública)
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

// Cache simple en memoria para reducir llamadas
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

export async function GET(request: NextRequest) {
    // Verificar que la URL esté configurada
    if (!APPS_SCRIPT_URL) {
        console.error('[API Proxy] APPS_SCRIPT_URL no configurada');
        return NextResponse.json(
            { success: false, error: 'API no configurada en el servidor' },
            { status: 500 }
        );
    }

    try {
        // Obtener parámetros de la request original
        const searchParams = request.nextUrl.searchParams;
        const action = searchParams.get('action') || 'ping';

        // Construir URL para Apps Script
        const url = new URL(APPS_SCRIPT_URL);
        searchParams.forEach((value, key) => {
            url.searchParams.append(key, value);
        });

        // Generar clave de cache
        const cacheKey = url.toString();

        // Verificar cache (excepto para acciones que necesitan datos frescos)
        const freshActions = ['ping', 'reprocesar'];
        if (!freshActions.includes(action)) {
            const cached = cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log(`[API Proxy] Cache HIT para: ${action}`);
                return NextResponse.json(cached.data);
            }
        }

        console.log(`[API Proxy] Llamando Apps Script: ${action}`);
        const startTime = Date.now();

        // Hacer la llamada al Apps Script desde el servidor
        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow', // Apps Script hace redirect
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Apps Script respondió con status: ${response.status}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        console.log(`[API Proxy] ${action} completado en ${duration}ms`);

        // Guardar en cache si fue exitoso
        if (data.success) {
            cache.set(cacheKey, { data, timestamp: Date.now() });
        }

        // Retornar respuesta al cliente
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                'X-Cache': 'MISS',
                'X-Response-Time': `${duration}ms`
            }
        });

    } catch (error) {
        console.error('[API Proxy] Error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

        return NextResponse.json(
            {
                success: false,
                error: `Error de conexión: ${errorMessage}`,
                timestamp: new Date().toISOString()
            },
            { status: 502 }
        );
    }
}

// Manejar POST para futuras acciones (reprocesar, etc.)
export async function POST(request: NextRequest) {
    if (!APPS_SCRIPT_URL) {
        return NextResponse.json(
            { success: false, error: 'API no configurada' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('[API Proxy POST] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error en POST' },
            { status: 502 }
        );
    }
}
