'use client';

import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface Notification {
    id: string;
    message: string;
    time: string;
    type: 'warning' | 'info' | 'error' | 'success';
}

export function Header() {
    const { data: session, status } = useSession();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

    // Usuario desde la sesión
    const user = session?.user ? {
        name: session.user.name || 'Usuario',
        email: session.user.email || '',
        role: (session.user as { role?: string }).role || 'EJECUTIVO',
        image: session.user.image
    } : null;

    // Cargar notificaciones desde la API
    const loadNotifications = useCallback(async () => {
        // Solo cargar si hay sesión
        if (status !== 'authenticated') {
            setNotifications([]);
            setIsLoadingNotifications(false);
            return;
        }

        try {
            setIsLoadingNotifications(true);
            const response = await fetch('/api/apps-script?action=alertas');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.alertas) {
                    const notifs = data.alertas.slice(0, 5).map((a: { id?: string; titulo?: string; message?: string; tipo?: string }, idx: number) => ({
                        id: a.id || String(idx),
                        message: a.titulo || a.message || 'Notificación',
                        time: 'Reciente',
                        type: (a.tipo || 'info') as 'warning' | 'info' | 'error' | 'success'
                    }));
                    setNotifications(notifs);
                    return;
                }
            }
            // Si falla, dejar vacío (NO usar mock)
            setNotifications([]);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
            setNotifications([]);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, [status]);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 120000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = () => {
            setShowUserMenu(false);
            setShowNotifications(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Si está cargando la sesión, mostrar header básico
    if (status === 'loading') {
        return (
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
                <div className="flex items-center justify-between h-full px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
            <div className="flex items-center justify-between h-full px-4">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <svg viewBox="0 0 40 40" className="w-full h-full">
                                <g fill="#CD3529">
                                    <path d="M20 5C15 5 11 10 11 15C11 18 12 20 14 22C10 22 5 24 5 30C5 32 8 34 12 34C16 34 19 31 20 28C21 31 24 34 28 34C32 34 35 32 35 30C35 24 30 22 26 22C28 20 29 18 29 15C29 10 25 5 20 5Z" opacity="0.9" />
                                </g>
                            </svg>
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-xl font-bold text-gray-700">Trans</span>
                            <span className="text-xl font-bold text-[#CD3529]">peruana</span>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 hidden sm:block">|</span>
                    <span className="text-sm text-gray-500 hidden sm:block">Portal de Monitoreo ETL</span>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNotifications(!showNotifications);
                                setShowUserMenu(false);
                            }}
                            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Notificaciones"
                        >
                            <Bell size={20} className="text-gray-600" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-[#CD3529] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 animate-slideIn">
                                <div className="p-3 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {isLoadingNotifications ? (
                                        <div className="p-4 text-center text-gray-500">
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#CD3529] rounded-full animate-spin mx-auto mb-2"></div>
                                            Cargando...
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No hay notificaciones
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div key={notif.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                                <p className="text-sm text-gray-700">{notif.message}</p>
                                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowUserMenu(!showUserMenu);
                                setShowNotifications(false);
                            }}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {/* Avatar - usar imagen de Google si existe */}
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#CD3529] text-white flex items-center justify-center">
                                    <span className="text-sm font-medium">{user?.name?.[0] || 'U'}</span>
                                </div>
                            )}
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-700">{user?.name || 'Usuario'}</p>
                                <p className="text-xs text-gray-500">{user?.role || 'Usuario'}</p>
                            </div>
                            <ChevronDown size={16} className="text-gray-400 hidden md:block" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 animate-slideIn">
                                <div className="p-3 border-b border-gray-200">
                                    <p className="font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                                <div className="p-1">
                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                        <User size={16} />
                                        <span>Mi Perfil</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#CD3529] hover:bg-red-50 rounded-md"
                                        onClick={() => signOut({ callbackUrl: '/login' })}
                                    >
                                        <LogOut size={16} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {(showNotifications || showUserMenu) && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => {
                        setShowNotifications(false);
                        setShowUserMenu(false);
                    }}
                />
            )}
        </header>
    );
}
