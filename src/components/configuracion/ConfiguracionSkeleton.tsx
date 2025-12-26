export function ConfiguracionSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200" />
                    <div>
                        <div className="h-8 w-36 bg-gray-200 rounded" />
                        <div className="h-4 w-56 bg-gray-100 rounded mt-2" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                    <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <div className="h-10 w-28 bg-gray-200 rounded" />
                <div className="h-10 w-28 bg-gray-200 rounded" />
                <div className="h-10 w-24 bg-gray-200 rounded" />
            </div>

            {/* Content Skeleton */}
            <div className="card">
                <div className="card-header flex items-center justify-between">
                    <div>
                        <div className="h-6 w-48 bg-gray-200 rounded" />
                        <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
                    </div>
                    <div className="h-9 w-32 bg-gray-200 rounded-lg" />
                </div>
                <div className="card-body">
                    <div className="divide-y divide-gray-100">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center justify-between py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                    <div className="h-5 w-48 bg-gray-200 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                                    <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
