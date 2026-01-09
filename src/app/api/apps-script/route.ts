/**
 * API Route Proxy para Google Apps Script
 * Elimina problemas CORS al actuar como intermediario server-side
 * PROTEGIDO: Requiere sesión autenticada
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// URL del Apps Script (variable de entorno del servidor, NO pública)
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN || '';


export async function GET(request: NextRequest) {
    // ========== PROTECCIÓN: Verificar sesión ==========
    const session = await auth();

    if (!session || !session.user?.email) {
        return NextResponse.json(
            { success: false, error: 'No autorizado. Inicie sesión.' },
            { status: 401 }
        );
    }

    const userEmail = session.user.email.toLowerCase();
    const userRole = (session.user as { role?: string }).role || 'EJECUTIVO';
    // =================================================

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

        // ========== AGREGAR TOKEN Y EMAIL (SECURITY HARDENED) ==========
        if (APPS_SCRIPT_TOKEN) {
            url.searchParams.append('_token', APPS_SCRIPT_TOKEN);
        }

        // ⚠️ SECURITY: SIEMPRE forzar ownerEmail desde session
        // NO confiar en ownerEmail del cliente (anti-spoofing)
        // Admin puede filtrar por compañía/estado, pero ownerEmail es SIEMPRE de session
        if (userRole === 'ADMIN') {
            // Admin puede pasar ownerEmail=ALL para ver todo (común)
            // O puede NO pasar ownerEmail y ver todo también
            const clientOwnerFilter = searchParams.get('ownerEmail');
            if (clientOwnerFilter && clientOwnerFilter.toUpperCase() === 'ALL') {
                url.searchParams.set('ownerEmail', 'ALL');
            } else {
                // Si admin NO especifica ALL, usar su propio email
                // (para casos donde admin quiere ver solo sus propios procesos)
                url.searchParams.set('ownerEmail', userEmail);
            }
        } else {
            // Ejecutivo SIEMPRE ve solo sus datos - forzar su email
            // IGNORAR cualquier ownerEmail que venga del cliente
            url.searchParams.set('ownerEmail', userEmail);
        }
        // ================================================================


        console.log(`[API Proxy] ${userEmail} llamando: ${action}`);
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

        // ========== CACHE DINÁMICO ==========
        // Endpoints que NO deben cachearse (user-scoped)
        const USER_SCOPED_ACTIONS = [
            'alertas', 'notificaciones', 'procesos',
            'descargas', 'users.getMe', 'users.list',
            'bitacora', 'errores'
        ];

        const isUserScoped = USER_SCOPED_ACTIONS.includes(action) ||
            searchParams.get('ownerEmail') !== null;

        const cacheControl = isUserScoped
            ? 'private, no-store, must-revalidate'
            : 'private, s-maxage=30, stale-while-revalidate=60';
        // ====================================

        // Retornar respuesta al cliente
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': cacheControl,
                'X-Cache': isUserScoped ? 'BYPASS' : 'MISS',
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
    // ========== PROTECCIÓN: Verificar sesión ==========
    const session = await auth();

    if (!session || !session.user?.email) {
        return NextResponse.json(
            { success: false, error: 'No autorizado' },
            { status: 401 }
        );
    }
    // =================================================

    if (!APPS_SCRIPT_URL) {
        return NextResponse.json(
            { success: false, error: 'API no configurada' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        const userEmail = session.user.email.toLowerCase();
        const userRole = (session.user as { role?: string }).role || 'EJECUTIVO';

        // ========== SECURITY: Forzar ownerEmail desde session ==========
        // NUNCA confiar en ownerEmail del cliente (anti-spoofing)
        if (userRole === 'ADMIN') {
            // Admin puede especificar ownerEmail=ALL en el body si quiere
            if (body.ownerEmail && body.ownerEmail.toUpperCase() === 'ALL') {
                body.ownerEmail = 'ALL';
            } else {
                // Si no especifica ALL, forzar su propio email
                body.ownerEmail = userEmail;
            }
        } else {
            // Ejecutivo SIEMPRE su propio email - IGNORAR cliente
            body.ownerEmail = userEmail;
        }
        // ================================================================

        // Agregar token al body
        if (APPS_SCRIPT_TOKEN) {
            body._token = APPS_SCRIPT_TOKEN;
        }

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
