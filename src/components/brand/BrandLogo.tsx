import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoVariant = 'wordmark' | 'mark';
type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
    variant?: LogoVariant;
    size?: LogoSize;
    className?: string;
    priority?: boolean;
    showSubtitle?: boolean;
    /** Modo header: usa contenedor de altura fija para no empujar el layout */
    headerMode?: boolean;
}

// Dimensiones para modo normal (Login, etc)
const WORDMARK_SIZES: Record<LogoSize, { width: number; height: number }> = {
    sm: { width: 140, height: 140 },
    md: { width: 200, height: 200 },
    lg: { width: 230, height: 230 },
    xl: { width: 280, height: 280 },
};

const MARK_SIZES: Record<LogoSize, { width: number; height: number }> = {
    sm: { width: 28, height: 28 },
    md: { width: 34, height: 34 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 },
};

// Dimensiones para modo header (altura fija para no empujar layout)
const HEADER_WORDMARK = { width: 120, height: 40 }; // Contenedor fijo, logo escala dentro
const HEADER_MARK = { width: 40, height: 40 };

/**
 * Componente de logo oficial de Transperuana
 * - Usa el logo PNG oficial sin distorsión
 * - variant="wordmark": Logo completo (isotipo + texto)
 * - variant="mark": Solo isotipo
 * - headerMode: Usa contenedor de altura fija para el header
 */
export function BrandLogo({
    variant = 'wordmark',
    size = 'md',
    className,
    priority = false,
    showSubtitle = false,
    headerMode = false,
}: BrandLogoProps) {
    const logoSrc = variant === 'mark'
        ? '/brand/transperuana-mark.png'
        : '/brand/transperuana-logo.png';

    // Modo header: contenedor fijo con Image fill
    if (headerMode) {
        const dimensions = variant === 'mark' ? HEADER_MARK : HEADER_WORDMARK;
        return (
            <div
                className={cn("relative flex-shrink-0", className)}
                style={{ width: dimensions.width, height: dimensions.height }}
            >
                <Image
                    src={logoSrc}
                    alt="Transperuana Corredores de Seguros"
                    fill
                    priority={priority}
                    className="object-contain"
                    sizes={`${dimensions.width}px`}
                />
            </div>
        );
    }

    // Modo normal (Login, etc)
    const dimensions = variant === 'mark' ? MARK_SIZES[size] : WORDMARK_SIZES[size];

    return (
        <div className={cn("flex items-center gap-2 flex-shrink-0", className)}>
            <Image
                src={logoSrc}
                alt="Transperuana Corredores de Seguros"
                width={dimensions.width}
                height={dimensions.height}
                priority={priority}
                className="object-contain flex-shrink-0"
                style={{ height: 'auto', width: dimensions.width }}
            />
            {showSubtitle && (
                <div className="hidden sm:block">
                    <p className="text-xs text-gray-500">Portal de Monitoreo ETL</p>
                </div>
            )}
        </div>
    );
}

export default BrandLogo;
