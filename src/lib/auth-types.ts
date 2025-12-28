/**
 * Tipos extendidos para NextAuth
 * Define el rol del usuario en la sesión
 */
import "next-auth"

export type UserRole = "ADMIN" | "EJECUTIVO"

declare module "next-auth" {
    interface Session {
        user: {
            role?: UserRole
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }

    interface User {
        role?: UserRole
    }
}

export interface ExtendedUser {
    name: string | null
    email: string | null
    image: string | null
    role: UserRole
}
