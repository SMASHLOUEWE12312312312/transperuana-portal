'use client';

import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock user data
    const user = {
        name: 'Juan Pérez',
        email: 'jperez@transperuana.com.pe',
        role: 'Administrador'
    };

    const notifications = [
        { id: '1', message: '3 procesos con errores pendientes', time: 'Hace 15 min', type: 'warning' },
        { id: '2', message: 'Nuevo correo de ACEROS AREQUIPA', time: 'Hace 30 min', type: 'info' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
            <div className="flex items-center justify-between h-full px-4">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {/* Transperuana Logo Symbol */}
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
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowUserMenu(false);
                            }}
                            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Notificaciones"
                            aria-haspopup="true"
                            aria-expanded={showNotifications}
                        >
                            <Bell size={20} className="text-gray-600" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-[#CD3529] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 animate-slideIn">
                                <div className="p-3 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                            <p className="text-sm text-gray-700">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-gray-200">
                                    <button className="w-full text-sm text-[#CD3529] hover:underline py-1">
                                        Ver todas
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowUserMenu(!showUserMenu);
                                setShowNotifications(false);
                            }}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Menú de usuario"
                            aria-haspopup="true"
                            aria-expanded={showUserMenu}
                        >
                            <div className="w-8 h-8 rounded-full bg-[#CD3529] text-white flex items-center justify-center">
                                <span className="text-sm font-medium">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </span>
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                            <ChevronDown size={16} className="text-gray-400 hidden md:block" />
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 animate-slideIn">
                                <div className="p-3 border-b border-gray-200">
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                <div className="p-1">
                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                        <User size={16} />
                                        <span>Mi Perfil</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#CD3529] hover:bg-red-50 rounded-md">
                                        <LogOut size={16} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Click outside to close dropdowns */}
            {(showNotifications || showUserMenu) && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => {
                        setShowNotifications(false);
                        setShowUserMenu(false);
                    }}
                    aria-hidden="true"
                />
            )}
        </header>
    );
}
