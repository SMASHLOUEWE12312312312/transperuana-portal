'use client';

import { cn, formatRelativeTime, getStatusColorClass, formatStatus } from '@/lib/utils';
import { ActivityItem } from '@/lib/types';
import { FileText, Mail, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

interface TimelineProps {
    items: ActivityItem[];
    loading?: boolean;
    maxItems?: number;
}

export function Timeline({ items, loading = false, maxItems }: TimelineProps) {
    const displayItems = maxItems ? items.slice(0, maxItems) : items;

    const getIcon = (tipo: ActivityItem['tipo'], estado: string) => {
        if (tipo === 'correo') return <Mail size={16} />;
        if (tipo === 'error') return <AlertTriangle size={16} />;

        switch (estado) {
            case 'COMPLETADO':
                return <CheckCircle size={16} />;
            case 'ERROR':
                return <XCircle size={16} />;
            case 'EN_PROCESO':
                return <Clock size={16} />;
            default:
                return <FileText size={16} />;
        }
    };

    const getIconColor = (tipo: ActivityItem['tipo'], estado: string) => {
        if (tipo === 'correo') return 'bg-blue-100 text-blue-600';
        if (tipo === 'error') return 'bg-red-100 text-red-600';

        switch (estado) {
            case 'COMPLETADO':
                return 'bg-green-100 text-green-600';
            case 'COMPLETADO_CON_ERRORES':
                return 'bg-yellow-100 text-yellow-600';
            case 'ERROR':
                return 'bg-red-100 text-red-600';
            case 'EN_PROCESO':
                return 'bg-blue-100 text-blue-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full skeleton" />
                        <div className="flex-1">
                            <div className="h-4 w-32 skeleton mb-2" />
                            <div className="h-3 w-48 skeleton mb-1" />
                            <div className="h-3 w-20 skeleton" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No hay actividad reciente
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" aria-hidden="true" />

            <div className="space-y-4">
                {displayItems.map((item, index) => (
                    <div
                        key={item.id}
                        className={cn(
                            "relative flex gap-3 pl-0 animate-fadeIn",
                            item.link && "cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Icon */}
                        <div className={cn(
                            "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            getIconColor(item.tipo, item.estado)
                        )}>
                            {getIcon(item.tipo, item.estado)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {item.link ? (
                                <Link href={item.link} className="group">
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#CD3529]">
                                        {item.titulo}
                                    </p>
                                </Link>
                            ) : (
                                <p className="text-sm font-medium text-gray-900">{item.titulo}</p>
                            )}
                            <p className="text-sm text-gray-500 truncate">{item.descripcion}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(item.timestamp)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
