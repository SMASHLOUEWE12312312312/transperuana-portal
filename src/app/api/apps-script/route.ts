/**
 * API Route Proxy para Google Apps Script
 * Elimina problemas CORS al actuar como intermediario server-side
 * PROTEGIDO: Requiere sesión autenticada + ALLOWLIST
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// URL del Apps Script (variable de entorno del servidor, NO pública)
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN || '';

// ==========================================
// ALLOWLIST CACHE (COMMIT 2)
// ==========================================
type AccessCacheEntry = {
    allowed: boolean;
    rol?: string;
    estado?: string;
    reason?: string;
    exp: number;
};

// In-memory cache (puede reiniciarse en serverless - OK)
const accessCache = new Map<string, AccessCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Valida acceso del usuario llamando a Apps Script validateAccess
 * Con cache de 5 minutos para reducir calls
 */
async function validateAccess(email: string): Promise<AccessCacheEntry> {
    const now = Date.now();

    // Check cache
    const cached = accessCache.get(email);
    if (cached && cached.exp > now) {
        return cached;
    }

    // Call Apps Script
    try {
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.set('action', 'validateAccess');
        url.searchParams.set('email', email);
        if (APPS_SCRIPT_TOKEN) {
            url.searchParams.set('_token', APPS_SCRIPT_TOKEN);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`validateAccess failed: ${response.status}`);
        }

        const data = await response.json();

        const entry: AccessCacheEntry = {
            allowed: data.allowed === true,
            rol: data.rol,
            estado: data.estado,
            reason: data.reason,
            exp: now + CACHE_TTL
        };

        // Cache result
        accessCache.set(email, entry);

        return entry;

    } catch (error) {
        console.error('[ALLOWLIST] Error validating access:', error);
        // Fail-closed: si hay error, denegar acceso
        return {
            allowed: false,
            reason: 'Error de validación',
            exp: now + 60000 // Cache error 1 min
        };
    }
}


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

    // ========== ALLOWLIST ENFORCEMENT (COMMIT 2) ==========
    const access = await validateAccess(userEmail);
    if (!access.allowed) {
        console.warn(`[ALLOWLIST] Access denied for ${userEmail}: ${access.reason}`);
        return NextResponse.json(
            { success: false, error: 'Acceso denegado', reason: access.reason },
            { status: 403 }
        );
    }
    // =====================================================

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

        // ⚠️ SECURITY HOTFIX P0: SIEMPRE forzar requesterEmail desde session
        // CRÍTICO: Prevenir bypass de RBAC vía spoof de requesterEmail
        // Un EJECUTIVO allowed NO puede hacerse pasar por ADMIN enviando requesterEmail=admin@...
        // Backend debe recibir el email REAL del usuario autenticado
        url.searchParams.delete('requesterEmail'); // Eliminar cualquier spoof
        url.searchParams.set('requesterEmail', userEmail); // Forzar email real
        // console.log('[SECURITY] requesterEmail forced:', userEmail); // Audit log
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

        // ========== CACHE DINÁMICO (HOTFIX: usar url.searchParams hardenizado) ==========
        // Endpoints que NO deben cachearse (user-scoped)
        const USER_SCOPED_ACTIONS = [
            'alertas', 'notificaciones', 'procesos',
            'descargas', 'users.getMe', 'users.list',
            'bitacora', 'errores'
        ];

        // Endpoints que NUNCA deben cachearse (admin/monitoring)
        const NO_CACHE_ACTIONS = ['checkMetrics', 'health', 'validateAccess'];

        // HOTFIX: Calcular isUserScoped con url.searchParams (post-hardening)
        // NO usar searchParams original del request
        const finalOwnerEmail = url.searchParams.get('ownerEmail');
        const isUserScoped = USER_SCOPED_ACTIONS.includes(action) || !!finalOwnerEmail;
        const isNoCache = NO_CACHE_ACTIONS.includes(action);

        const cacheControl = (isUserScoped || isNoCache)
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

    const userEmail = session.user.email.toLowerCase();
    const userRole = (session.user as { role?: string }).role || 'EJECUTIVO';

    // ========== ALLOWLIST ENFORCEMENT (COMMIT 2) ==========
    const access = await validateAccess(userEmail);
    if (!access.allowed) {
        console.warn(`[ALLOWLIST] Access denied for ${userEmail}: ${access.reason}`);
        return NextResponse.json(
            { success: false, error: 'Acceso denegado', reason: access.reason },
            { status: 403 }
        );
    }
    // =====================================================

    if (!APPS_SCRIPT_URL) {
        return NextResponse.json(
            { success: false, error: 'API no configurada' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

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

        // ⚠️ SECURITY HOTFIX P0: SIEMPRE forzar requesterEmail desde session
        // CRÍTICO: Prevenir bypass de RBAC vía spoof de requesterEmail en body POST
        // Ignorar cualquier requesterEmail que venga en el body del cliente
        delete body.requesterEmail; // Eliminar spoof
        body.requesterEmail = userEmail; // Forzar email real
        // console.log('[SECURITY POST] requesterEmail forced:', userEmail); // Audit log
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
