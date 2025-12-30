'use client';

import { Bell, LogOut, ChevronDown, ExternalLink, CheckCircle, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface Notification {
    id: string;
    titulo: string;
    mensaje?: string;
    tipo: 'warning' | 'info' | 'error' | 'success';
    timestamp?: string;
    idProceso?: string;
}

type NotificationState = 'idle' | 'loading' | 'success' | 'error';

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

// Polling cada 60 segundos
const POLLING_INTERVAL = 60000;

export function Header() {
    const { data: session, status } = useSession();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifState, setNotifState] = useState<NotificationState>('idle');
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const retryCountRef = useRef(0);

    // Usuario desde la sesión
    const user = session?.user ? {
        name: session.user.name || 'Usuario',
        email: session.user.email || '',
        role: (session.user as { role?: string }).role || 'EJECUTIVO',
        image: session.user.image
    } : null;

    // Cargar notificaciones con retry
    const loadNotifications = useCallback(async (isRetry = false) => {
        if (status !== 'authenticated') {
            setNotifications([]);
            setNotifState('idle');
            return;
        }

        try {
            if (!isRetry) {
                setNotifState('loading');
            }

            // Timeout de 10 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch('/api/apps-script?action=alertas&limite=15', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.alertas) {
                    setNotifications(data.alertas);
                    setNotifState('success');
                    setLastFetch(new Date());
                    retryCountRef.current = 0;

                    // Calcular no leídas basado en localStorage
                    const lastSeen = localStorage.getItem('notif_last_seen');
                    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
                    const unread = data.alertas.filter((n: Notification) => {
                        if (!n.timestamp) return true;
                        return new Date(n.timestamp).getTime() > lastSeenTime;
                    }).length;
                    setUnreadCount(unread);
                } else {
                    throw new Error('Respuesta inválida');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                logger.debug('Notificaciones: timeout');
            }

            retryCountRef.current++;

            // Solo mostrar error después de 2 intentos fallidos
            if (retryCountRef.current >= 2) {
                setNotifState('error');
            }

            // Mantener notificaciones previas si las hay
            if (notifications.length === 0) {
                setNotifState('error');
            }
        }
    }, [status, notifications.length]);

    // Retry handler
    const handleRetry = useCallback(() => {
        retryCountRef.current = 0;
        loadNotifications(true);
    }, [loadNotifications]);

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
        const interval = setInterval(loadNotifications, POLLING_INTERVAL);
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

    // Formatear tiempo relativo
    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    };

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
                        {/* Mobile: isotipo */}
                        <div className="sm:hidden">
                            <BrandLogo variant="mark" headerMode />
                        </div>
                        {/* Desktop: wordmark + subtitle */}
                        <div className="hidden sm:flex items-center gap-3">
                            <BrandLogo variant="wordmark" headerMode />
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
                                <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                                        <p className="text-xs text-gray-500">Actividad reciente del sistema</p>
                                    </div>
                                    {lastFetch && (
                                        <span className="text-[10px] text-gray-400">
                                            {formatRelativeTime(lastFetch.toISOString())}
                                        </span>
                                    )}
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {/* Estado: Cargando */}
                                    {notifState === 'loading' && notifications.length === 0 && (
                                        <div className="p-8 text-center">
                                            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#CD3529] rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    )}

                                    {/* Estado: Error */}
                                    {notifState === 'error' && notifications.length === 0 && (
                                        <div className="p-8 text-center">
                                            <XCircle size={32} className="text-red-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 font-medium">No se pudo cargar</p>
                                            <p className="text-xs text-gray-400 mt-1">Verifica tu conexión</p>
                                            <button
                                                onClick={handleRetry}
                                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#CD3529] hover:text-[#b02d23] transition-colors"
                                            >
                                                <RefreshCw size={14} />
                                                Reintentar
                                            </button>
                                        </div>
                                    )}

                                    {/* Estado: Sin notificaciones */}
                                    {notifState !== 'loading' && notifState !== 'error' && notifications.length === 0 && (
                                        <div className="p-8 text-center">
                                            <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-medium">No tienes notificaciones</p>
                                            <p className="text-xs text-gray-400 mt-1">Te avisaremos cuando haya actividad</p>
                                        </div>
                                    )}

                                    {/* Lista de notificaciones */}
                                    {notifications.length > 0 && (
                                        notifications.map((notif) => {
                                            const IconComponent = NOTIFICATION_ICONS[notif.tipo] || Info;
                                            const colorClass = NOTIFICATION_COLORS[notif.tipo] || NOTIFICATION_COLORS.info;
                                            const notifHref = notif.idProceso
                                                ? `/procesos/${notif.idProceso}`
                                                : '/procesos';

                                            return (
                                                <Link
                                                    key={notif.id}
                                                    href={notifHref}
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
                                                            {notif.mensaje && (
                                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                                                    {notif.mensaje}
                                                                </p>
                                                            )}
                                                            {notif.timestamp && (
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {formatRelativeTime(notif.timestamp)}
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
