"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

/**
 * Providers globales de la aplicación
 * - SessionProvider: NextAuth session management
 * - QueryClientProvider: React Query para data fetching
 */
export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 1000, // 5 segundos - datos frescos
                gcTime: 10 * 60 * 1000, // 10 minutos en garbage collection
                refetchOnWindowFocus: true, // Refetch al volver a la pestaña
                refetchOnMount: 'always', // Siempre refetch al montar
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
