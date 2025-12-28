/**
 * Configuración de NextAuth v5 para autenticación corporativa
 * Solo permite cuentas @transperuana.com.pe
 */
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || "transperuana.com.pe"
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase())

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
            // Verificar que el email pertenezca al dominio permitido
            const email = user.email?.toLowerCase() || ""
            if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
                return false // Rechazar acceso
            }
            return true
        },
        async jwt({ token, user }) {
            // Asignar rol basado en lista de administradores
            if (user) {
                const email = user.email?.toLowerCase() || ""
                token.role = ADMIN_EMAILS.includes(email) ? "ADMIN" : "EJECUTIVO"
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
