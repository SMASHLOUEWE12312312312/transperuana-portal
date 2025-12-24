import { cn, getStatusColorClass, formatStatus, getCompanyColorClass, formatCompanyName, getErrorTypeColorClass } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
    type?: 'status' | 'company' | 'error' | 'seguro';
    size?: 'sm' | 'md';
    loading?: boolean;
}

export function StatusBadge({
    status,
    type = 'status',
    size = 'md',
    loading = false
}: StatusBadgeProps) {
    if (loading) {
        return (
            <span className={cn(
                "badge badge-gray",
                size === 'sm' && "text-[10px] px-2 py-0.5"
            )}>
                <Loader2 size={12} className="animate-spin mr-1" />
                Cargando
            </span>
        );
    }

    const getColorClass = () => {
        switch (type) {
            case 'company':
                return getCompanyColorClass(status);
            case 'error':
                return getErrorTypeColorClass(status);
            case 'seguro':
                return status === 'SCTR' ? 'badge-info' : 'badge-sanitas';
            default:
                return getStatusColorClass(status);
        }
    };

    const getLabel = () => {
        switch (type) {
            case 'company':
                return formatCompanyName(status);
            case 'status':
                return formatStatus(status);
            case 'seguro':
                return status === 'VIDA_LEY' ? 'Vida Ley' : status;
            default:
                return status;
        }
    };

    const isAnimated = type === 'status' && status === 'EN_PROCESO';

    return (
        <span className={cn(
            "badge",
            getColorClass(),
            size === 'sm' && "text-[10px] px-2 py-0.5",
            isAnimated && "animate-pulse"
        )}>
            {isAnimated && (
                <Loader2 size={10} className="animate-spin mr-1" />
            )}
            {getLabel()}
        </span>
    );
}
