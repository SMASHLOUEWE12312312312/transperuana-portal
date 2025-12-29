import { cn } from '@/lib/utils';

export function Loader({ size = 'md', text }: { size?: string; text?: string }) {
    const sizes: Record<string, string> = {
        xs: 'w-4 h-4', sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-14 h-14'
    };
    return (
        <div className="flex flex-col items-center justify-center gap-3" role="status">
            <svg className={sizes[size] || sizes.md} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-gray-200" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#CD3529" strokeWidth="2" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                </path>
            </svg>
            {text && <p className="text-gray-500 text-sm">{text}</p>}
        </div>
    );
}

export function InlineLoader({ className }: { className?: string }) {
    return (
        <svg className={cn('animate-spin w-4 h-4', className)} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" className="opacity-75" />
        </svg>
    );
}
