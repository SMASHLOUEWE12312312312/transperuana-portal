'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Users, UserPlus, Search, CheckCircle, XCircle, Clock, Edit, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Usuario {
    email: string;
    nombre: string;
    rol: string;
    estado: string;
    primerlogin?: string;
    ultimologin?: string;
}

const ESTADO_COLORS: Record<string, string> = {
    'ACTIVO': 'bg-green-100 text-green-700',
    'PENDIENTE': 'bg-amber-100 text-amber-700',
    'INACTIVO': 'bg-red-100 text-red-700'
};

const ESTADO_ICONS: Record<string, React.ElementType> = {
    'ACTIVO': CheckCircle,
    'PENDIENTE': Clock,
    'INACTIVO': XCircle
};

export function UsuariosTab() {
    const { data: session } = useSession();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [formData, setFormData] = useState({ email: '', nombre: '', rol: 'EJECUTIVO', estado: 'PENDIENTE' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userEmail = session?.user?.email || '';
    const userRole = (session?.user as { role?: string })?.role || 'EJECUTIVO';
    const isAdmin = userRole === 'ADMIN';

    const loadUsuarios = useCallback(async () => {
        if (!isAdmin) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/apps-script?action=users.list&requesterEmail=${encodeURIComponent(userEmail)}`);
            const data = await res.json();
            if (data.success) {
                setUsuarios(data.usuarios || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, userEmail]);

    useEffect(() => {
        if (isAdmin) loadUsuarios();
    }, [isAdmin, loadUsuarios]);

    // Non-admin message
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No tienes permisos para gestionar usuarios</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const params = new URLSearchParams({
                action: 'users.upsert',
                requesterEmail: userEmail,
                email: formData.email,
                nombre: formData.nombre,
                rol: formData.rol,
                estado: formData.estado
            });
            const res = await fetch(`/api/apps-script?${params}`);
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setEditingUser(null);
                setFormData({ email: '', nombre: '', rol: 'EJECUTIVO', estado: 'PENDIENTE' });
                loadUsuarios();
            } else {
                alert(data.error || 'Error al guardar');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetStatus = async (email: string, estado: string) => {
        const params = new URLSearchParams({
            action: 'users.setStatus',
            requesterEmail: userEmail,
            email,
            estado
        });
        const res = await fetch(`/api/apps-script?${params}`);
        const data = await res.json();
        if (data.success) {
            loadUsuarios();
        } else {
            alert(data.error || 'Error al cambiar estado');
        }
    };

    const openEdit = (user: Usuario) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            estado: user.estado
        });
        setShowModal(true);
    };

    const openNew = () => {
        setEditingUser(null);
        setFormData({ email: '', nombre: '', rol: 'EJECUTIVO', estado: 'PENDIENTE' });
        setShowModal(true);
    };

    const filteredUsers = usuarios.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-500 text-sm">Administra usuarios del portal</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadUsuarios} className="btn-secondary" disabled={isLoading}>
                        <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} /> Actualizar
                    </button>
                    <button onClick={openNew} className="btn-primary">
                        <UserPlus size={16} /> Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por email o nombre..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                />
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usuario</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rol</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Último Login</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-[#CD3529] rounded-full animate-spin mx-auto mb-2" />
                                    Cargando...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                                    No se encontraron usuarios
                                </td>
                            </tr>
                        ) : filteredUsers.map(user => {
                            const EstadoIcon = ESTADO_ICONS[user.estado] || Clock;
                            return (
                                <tr key={user.email} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{user.nombre || '—'}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-medium",
                                            user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                        )}>
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                                            ESTADO_COLORS[user.estado] || 'bg-gray-100 text-gray-700'
                                        )}>
                                            <EstadoIcon size={12} />
                                            {user.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {user.ultimologin ? new Date(user.ultimologin).toLocaleString('es-PE') : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(user)} className="p-1 hover:bg-gray-100 rounded" title="Editar">
                                                <Edit size={16} className="text-gray-500" />
                                            </button>
                                            {user.estado !== 'ACTIVO' && (
                                                <button onClick={() => handleSetStatus(user.email, 'ACTIVO')} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">
                                                    Activar
                                                </button>
                                            )}
                                            {user.estado === 'ACTIVO' && (
                                                <button onClick={() => handleSetStatus(user.email, 'INACTIVO')} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                                                    Desactivar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">
                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="input w-full"
                                    required
                                    disabled={!!editingUser}
                                    placeholder="usuario@transperuana.com.pe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select
                                        value={formData.rol}
                                        onChange={e => setFormData({ ...formData, rol: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="EJECUTIVO">Ejecutivo</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select
                                        value={formData.estado}
                                        onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="ACTIVO">Activo</option>
                                        <option value="PENDIENTE">Pendiente</option>
                                        <option value="INACTIVO">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
