'use client';

import { Bell, LogOut, ChevronDown, ExternalLink, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface Notification {
    id: string;
    titulo: string;
    message?: string;
    tipo: 'warning' | 'info' | 'error' | 'success';
    timestamp?: string;
}

const NOTIFICATION_ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const NOTIFICATION_COLORS = {
    success: 'text-green-500 bg-green-50',
    error: 'text-red-500 bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-blue-500 bg-blue-50',
};

export function Header() {
    const { data: session, status } = useSession();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Usuario desde la sesión
    const user = session?.user ? {
        name: session.user.name || 'Usuario',
        email: session.user.email || '',
        role: (session.user as { role?: string }).role || 'EJECUTIVO',
        image: session.user.image
    } : null;

    // Cargar notificaciones
    const loadNotifications = useCallback(async () => {
        if (status !== 'authenticated') {
            setNotifications([]);
            setIsLoadingNotifications(false);
            return;
        }

        try {
            setIsLoadingNotifications(true);

            // Timeout de 8 segundos para evitar loading infinito
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch('/api/apps-script?action=alertas&limite=10', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.alertas) {
                    setNotifications(data.alertas);

                    // Calcular no leídas basado en localStorage
                    const lastSeen = localStorage.getItem('notif_last_seen');
                    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
                    const unread = data.alertas.filter((n: Notification) => {
                        if (!n.timestamp) return true; // Sin timestamp = nueva
                        return new Date(n.timestamp).getTime() > lastSeenTime;
                    }).length;
                    setUnreadCount(unread);
                } else {
                    setNotifications([]);
                    setUnreadCount(0);
                }
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            // Error silencioso para timeout o errores de red
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Notificaciones: timeout alcanzado');
            }
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, [status]);

    // Marcar como leídas al abrir
    const handleOpenNotifications = () => {
        setShowNotifications(!showNotifications);
        setShowUserMenu(false);

        if (!showNotifications && notifications.length > 0) {
            localStorage.setItem('notif_last_seen', new Date().toISOString());
            setUnreadCount(0);
        }
    };

    // Cargar y polling
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 120000); // 2 min
        return () => clearInterval(interval);
    }, [loadNotifications]);

    // Click outside para cerrar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowNotifications(false);
                setShowUserMenu(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Loading state del header
    if (status === 'loading') {
        return (
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
                <div className="flex items-center justify-between h-full px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
                        <div className="hidden sm:block">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-gray-100 rounded mt-1 animate-pulse" />
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                </div>
            </header>
        );
    }

    // No renderizar si no hay sesión
    if (!session) {
        return null;
    }

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
            <div className="flex items-center justify-between h-full px-4">
                {/* Logo */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        {/* Mobile: isotipo grande */}
                        <div className="sm:hidden flex-shrink-0">
                            <BrandLogo variant="mark" size="lg" />
                        </div>
                        {/* Desktop: wordmark completo */}
                        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                            <BrandLogo variant="wordmark" size="sm" />
                            <div>
                                <p className="text-xs text-gray-500">Portal de Monitoreo ETL</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={handleOpenNotifications}
                            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CD3529]/20"
                            aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
                            aria-expanded={showNotifications}
                            aria-haspopup="true"
                        >
                            <Bell size={20} className="text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#CD3529] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div
                                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-slideIn"
                                role="menu"
                            >
                                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                                    <p className="text-xs text-gray-500">Actividad reciente del sistema</p>
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {isLoadingNotifications ? (
                                        <div className="p-8 text-center">
                                            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#CD3529] rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-medium">No hay notificaciones</p>
                                            <p className="text-xs text-gray-400 mt-1">Las actividades recientes aparecerán aquí</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => {
                                            const IconComponent = NOTIFICATION_ICONS[notif.tipo] || Info;
                                            const colorClass = NOTIFICATION_COLORS[notif.tipo] || NOTIFICATION_COLORS.info;

                                            return (
                                                <Link
                                                    key={notif.id}
                                                    href={notif.id === 'errores' ? '/errores' : '/procesos'}
                                                    className="block p-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors"
                                                    onClick={() => setShowNotifications(false)}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                                                            <IconComponent size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {notif.titulo}
                                                            </p>
                                                            {notif.message && (
                                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                                                    {notif.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <ExternalLink size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                                        <Link
                                            href="/procesos"
                                            className="block text-center text-xs text-[#CD3529] hover:text-[#b02d23] font-medium py-1"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            Ver todos los procesos →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => {
                                setShowUserMenu(!showUserMenu);
                                setShowNotifications(false);
                            }}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CD3529]/20"
                            aria-label="Menú de usuario"
                            aria-expanded={showUserMenu}
                            aria-haspopup="true"
                        >
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#CD3529] text-white flex items-center justify-center ring-2 ring-gray-100">
                                    <span className="text-sm font-medium">
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                                    {user?.name || 'Usuario'}
                                </p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                            <ChevronDown
                                size={16}
                                className={cn(
                                    "text-gray-400 hidden md:block transition-transform duration-200",
                                    showUserMenu && "rotate-180"
                                )}
                            />
                        </button>

                        {showUserMenu && (
                            <div
                                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-slideIn"
                                role="menu"
                            >
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                                    <span className={cn(
                                        "inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full",
                                        user?.role === 'ADMIN'
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-blue-100 text-blue-700"
                                    )}>
                                        {user?.role === 'ADMIN' ? '👑 Administrador' : '👤 Ejecutivo'}
                                    </span>
                                </div>

                                <div className="p-1">
                                    <button
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#CD3529] hover:bg-red-50 rounded-lg transition-colors"
                                        onClick={() => signOut({ callbackUrl: '/login' })}
                                        role="menuitem"
                                    >
                                        <LogOut size={18} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
