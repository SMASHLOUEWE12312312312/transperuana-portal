/**
 * Configuración de NextAuth v5 para autenticación corporativa
 * Solo permite cuentas @transperuana.com.pe + ALLOWLIST (USUARIOS_PORTAL)
 */
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || "transperuana.com.pe"
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || ""
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN || ""

/**
 * Valida acceso del usuario contra USUARIOS_PORTAL (allowlist)
 * COMMIT 3: Block sign-in if user not in allowlist
 */
async function validateUserAccess(email: string): Promise<{ allowed: boolean; rol?: string; reason?: string }> {
    try {
        if (!APPS_SCRIPT_URL) {
            console.error('[AUTH] APPS_SCRIPT_URL not configured');
            return { allowed: false, reason: 'Configuration error' };
        }

        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.set('action', 'validateAccess');
        url.searchParams.set('email', email);
        if (APPS_SCRIPT_TOKEN) {
            url.searchParams.set('_token', APPS_SCRIPT_TOKEN);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store' // Never cache auth checks
        });

        if (!response.ok) {
            throw new Error(`validateAccess failed: ${response.status}`);
        }

        const data = await response.json();

        return {
            allowed: data.allowed === true,
            rol: data.rol,
            reason: data.reason
        };

    } catch (error) {
        console.error('[AUTH] Error validating access:', error);
        // Fail-closed: deny access on error
        return {
            allowed: false,
            reason: 'Validation error'
        };
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "select_account",
                    hd: ALLOWED_DOMAIN, // Forzar dominio corporativo en selector
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user }) {
            const email = user.email?.toLowerCase() || ""

            // 1. Verificar dominio permitido
            if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
                console.warn(`[AUTH] Domain not allowed: ${email}`);
                return false
            }

            // 2. ALLOWLIST: Verificar USUARIOS_PORTAL (COMMIT 3)
            const access = await validateUserAccess(email);
            if (!access.allowed) {
                console.warn(`[AUTH] Access denied for ${email}: ${access.reason}`);
                return false // Block sign-in
            }

            console.log(`[AUTH] Access granted for ${email} (${access.rol})`);
            return true
        },
        async jwt({ token, user }) {
            // COMMIT 3: Get role from backend (not from env var)
            if (user) {
                const email = user.email?.toLowerCase() || ""
                const access = await validateUserAccess(email);
                token.role = access.rol || 'EJECUTIVO'
                token.isAllowed = access.allowed
            }
            return token
        },
        async session({ session, token }) {
            // Exponer el rol en la sesión del cliente
            if (session.user) {
                (session.user as { role?: string }).role = token.role as string
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
        error: "/login"
    }
})
