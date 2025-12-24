import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
    format?: 'number' | 'percent' | 'time' | 'currency';
    loading?: boolean;
}

export function KPICard({
    icon,
    title,
    value,
    trend,
    trendLabel = 'vs ayer',
    format = 'number',
    loading = false
}: KPICardProps) {
    const getTrendIcon = () => {
        if (trend === undefined || trend === 0) return <Minus size={14} />;
        return trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
    };

    const getTrendColor = () => {
        if (trend === undefined || trend === 0) return 'text-gray-500';
        // For time metrics, negative is good (faster)
        if (format === 'time') {
            return trend < 0 ? 'text-green-600' : 'text-red-500';
        }
        return trend > 0 ? 'text-green-600' : 'text-red-500';
    };

    const formatValue = () => {
        if (typeof value === 'string') return value;

        switch (format) {
            case 'percent':
                return `${value.toFixed(1)}%`;
            case 'time':
                return `${value.toFixed(1)}s`;
            case 'currency':
                return value.toLocaleString('es-PE');
            default:
                return value.toLocaleString('es-PE');
        }
    };

    if (loading) {
        return (
            <div className="card card-body">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 skeleton rounded-lg" />
                    <div className="flex-1">
                        <div className="h-4 w-24 skeleton mb-2" />
                        <div className="h-8 w-20 skeleton mb-2" />
                        <div className="h-3 w-16 skeleton" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card card-body hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-[#CD3529]">
                    {icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatValue()}</p>

                    {/* Trend */}
                    {trend !== undefined && (
                        <div className={cn("flex items-center gap-1 mt-1 text-sm", getTrendColor())}>
                            {getTrendIcon()}
                            <span className="font-medium">
                                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                            </span>
                            <span className="text-gray-400">{trendLabel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
