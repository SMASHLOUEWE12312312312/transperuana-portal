'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
    LayoutDashboard,
    FileText,
    AlertCircle,
    Mail,
    Download,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { fetchDashboard, fetchProcesos, fetchBitacora, fetchErrores, fetchDescargas, fetchConfig } from '@/lib/api';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/procesos', label: 'Procesos', icon: <FileText size={20} /> },
    { href: '/errores', label: 'Errores', icon: <AlertCircle size={20} /> },
    { href: '/bitacora', label: 'Bitácora', icon: <Mail size={20} /> },
    { href: '/descargas', label: 'Descargas', icon: <Download size={20} /> },
    { href: '/configuracion', label: 'Configuración', icon: <Settings size={20} />, adminOnly: true },
];

// Mapa de prefetch: queryKey y fetcher para cada ruta
const PREFETCH_MAP: Record<string, { queryKey: string[]; fetcher: () => Promise<unknown> }> = {
    '/': { queryKey: ['dashboard'], fetcher: fetchDashboard },
    '/procesos': { queryKey: ['procesos', 'ALL'], fetcher: () => fetchProcesos({ limite: 200 }) },
    '/bitacora': { queryKey: ['bitacora'], fetcher: () => fetchBitacora({ limite: 100 }) },
    '/errores': { queryKey: ['errores'], fetcher: () => fetchErrores({ limite: 500 }) },
    '/descargas': { queryKey: ['descargas'], fetcher: fetchDescargas },
    '/configuracion': { queryKey: ['config'], fetcher: fetchConfig },
};

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    // Verificar rol de admin desde la sesión real
    const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';

    const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

    // Prefetch al hover para navegación instantánea
    const handlePrefetch = useCallback((href: string) => {
        const config = PREFETCH_MAP[href];
        if (!config) return;

        queryClient.prefetchQuery({
            queryKey: config.queryKey,
            queryFn: config.fetcher,
            staleTime: 30000, // 30 segundos de cache en prefetch
        });
    }, [queryClient]);

    return (
        <aside
            className={cn(
                "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-40",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <nav className="flex flex-col h-full p-3">
                {/* Navigation Items */}
                <div className="flex-1 space-y-1">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                onMouseEnter={() => handlePrefetch(item.href)}
                                className={cn(
                                    "nav-item",
                                    isActive && "active",
                                    collapsed && "justify-center px-2"
                                )}
                                title={collapsed ? item.label : undefined}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* Collapse Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="nav-item justify-center mt-4 border-t border-gray-200 pt-4"
                    aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    {!collapsed && <span className="flex-1">Colapsar</span>}
                </button>
            </nav>
        </aside>
    );
}
