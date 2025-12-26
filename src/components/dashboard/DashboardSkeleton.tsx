export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded-lg" />
            </div>

            {/* Alert Skeleton */}
            <div className="h-16 bg-amber-50 rounded-lg border border-amber-200" />

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-8 w-20 bg-gray-200 rounded mt-3" />
                                <div className="h-3 w-16 bg-gray-100 rounded mt-2" />
                            </div>
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <div className="card-header">
                        <div className="h-5 w-32 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded mt-2" />
                    </div>
                    <div className="card-body">
                        <div className="h-72 bg-gradient-to-b from-gray-100 to-gray-50 rounded" />
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="h-5 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-32 bg-gray-100 rounded mt-2" />
                    </div>
                    <div className="card-body">
                        <div className="h-48 flex items-center justify-center">
                            <div className="w-36 h-36 bg-gray-100 rounded-full" />
                        </div>
                        <div className="space-y-2 mt-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-200 rounded-full" />
                                        <div className="h-3 w-16 bg-gray-100 rounded" />
                                    </div>
                                    <div className="h-3 w-8 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card">
                    <div className="card-header">
                        <div className="h-5 w-28 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
                    </div>
                    <div className="card-body">
                        <div className="h-64 bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="lg:col-span-2 card">
                    <div className="card-header">
                        <div className="h-5 w-36 bg-gray-200 rounded" />
                        <div className="h-3 w-44 bg-gray-100 rounded mt-2" />
                    </div>
                    <div className="card-body space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                <div className="flex-1">
                                    <div className="h-4 w-48 bg-gray-200 rounded" />
                                    <div className="h-3 w-32 bg-gray-100 rounded mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
