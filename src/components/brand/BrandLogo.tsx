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
}

// Dimensiones por variante y tamaño
// Wordmark: logo completo (horizontal, más ancho)
// Mark: solo isotipo (cuadrado)
const WORDMARK_SIZES: Record<LogoSize, { width: number; height: number }> = {
    sm: { width: 140, height: 140 },
    md: { width: 180, height: 180 },
    lg: { width: 230, height: 230 },
    xl: { width: 280, height: 280 },
};

const MARK_SIZES: Record<LogoSize, { width: number; height: number }> = {
    sm: { width: 28, height: 28 },
    md: { width: 34, height: 34 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 },
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
    const dimensions = variant === 'mark' ? MARK_SIZES[size] : WORDMARK_SIZES[size];
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
