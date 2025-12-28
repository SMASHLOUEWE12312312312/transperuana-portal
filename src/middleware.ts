/**
 * Middleware de autenticación
 * Protege todas las rutas excepto /login, /api/auth/*, y assets estáticos
 */
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { pathname } = req.nextUrl

    // Rutas públicas
    const isAuthPage = pathname.startsWith("/login")
    const isAuthAPI = pathname.startsWith("/api/auth")
    const isPublicAsset = /\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/.test(pathname)

    // Permitir rutas de auth y assets públicos
    if (isAuthAPI || isPublicAsset) {
        return NextResponse.next()
    }

    // Redirigir a login si no está autenticado
    if (!isLoggedIn && !isAuthPage) {
        const loginUrl = new URL("/login", req.url)
        return NextResponse.redirect(loginUrl)
    }

    // Redirigir a home si ya está logueado y accede a /login
    if (isLoggedIn && isAuthPage) {
        const homeUrl = new URL("/", req.url)
        return NextResponse.redirect(homeUrl)
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
