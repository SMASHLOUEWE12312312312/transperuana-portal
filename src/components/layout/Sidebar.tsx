'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // For demo purposes, assume user is admin
    const isAdmin = true;

    const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

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
