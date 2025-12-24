import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state" role="status" aria-label={title}>
            <div className="empty-state-icon" aria-hidden="true">
                {icon}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="btn btn-primary"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Skeleton variants for loading states
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}>
                                <div className="h-4 w-20 skeleton" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex}>
                                    <div className={cn(
                                        "h-4 skeleton",
                                        colIndex === 0 ? "w-32" : "w-20"
                                    )} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="card card-body">
            <div className="space-y-3">
                <div className="h-5 w-1/3 skeleton" />
                <div className="h-4 w-full skeleton" />
                <div className="h-4 w-2/3 skeleton" />
            </div>
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="card card-body">
            <div className="h-5 w-1/4 skeleton mb-4" />
            <div className="h-64 w-full skeleton" />
        </div>
    );
}
