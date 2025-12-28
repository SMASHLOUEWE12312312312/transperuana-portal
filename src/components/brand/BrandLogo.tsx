import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoVariant = 'wordmark' | 'mark';
type LogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
    variant?: LogoVariant;
    size?: LogoSize;
    className?: string;
    priority?: boolean;
    showSubtitle?: boolean;
}

// Dimensiones por tamaño - altura fija, width auto para mantener aspect ratio
const SIZES: Record<LogoSize, { width: number; height: number }> = {
    sm: { width: 36, height: 36 },
    md: { width: 48, height: 48 },
    lg: { width: 120, height: 120 },
};

/**
 * Componente de logo oficial de Transperuana
 * - Usa el logo PNG oficial sin distorsión
 * - variant="wordmark": Logo completo (isotipo + texto)
 * - variant="mark": Solo isotipo
 */
export function BrandLogo({
    variant = 'wordmark',
    size = 'md',
    className,
    priority = false,
    showSubtitle = false,
}: BrandLogoProps) {
    const dimensions = SIZES[size];
    const logoSrc = variant === 'mark'
        ? '/brand/transperuana-mark.png'
        : '/brand/transperuana-logo.png';

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
