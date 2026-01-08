"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

/**
 * Providers globales de la aplicación
 * - SessionProvider: NextAuth session management
 * - QueryClientProvider: React Query para data fetching
 * 
 * COMMIT 8: Optimizado staleTime y refetchOnMount para navegación estable
 */
export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 15 * 1000, // 15 segundos - balance entre frescura y rendimiento
                gcTime: 10 * 60 * 1000, // 10 minutos en garbage collection
                refetchOnWindowFocus: true, // Refetch al volver a la pestaña
                refetchOnMount: false, // COMMIT 8: Usar cache si está fresco (polling cubre updates)
                retry: 2,
                refetchOnReconnect: true,
            },
        },
    }))

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </SessionProvider>
    )
}
