export function BitacoraSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-40 bg-gray-200 rounded" />
                    <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                    <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="h-4 w-12 bg-gray-100 rounded" />
                    <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
                </div>
                <div className="card p-4">
                    <div className="h-4 w-20 bg-green-100 rounded" />
                    <div className="h-8 w-12 bg-green-200 rounded mt-2" />
                </div>
                <div className="card p-4">
                    <div className="h-4 w-20 bg-yellow-100 rounded" />
                    <div className="h-8 w-12 bg-yellow-200 rounded mt-2" />
                </div>
                <div className="card p-4">
                    <div className="h-4 w-16 bg-red-100 rounded" />
                    <div className="h-8 w-12 bg-red-200 rounded mt-2" />
                </div>
            </div>

            {/* Filters Skeleton */}
            <div className="flex flex-wrap gap-4">
                <div className="h-10 flex-1 min-w-[250px] bg-gray-200 rounded-lg" />
                <div className="h-10 w-40 bg-gray-200 rounded-lg" />
            </div>

            {/* Timeline Items Skeleton */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="card p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                            <div className="h-5 w-64 bg-gray-200 rounded" />
                            <div className="h-4 w-48 bg-gray-100 rounded mt-2" />
                        </div>
                        <div className="text-right">
                            <div className="h-4 w-20 bg-gray-100 rounded" />
                            <div className="h-5 w-16 bg-gray-200 rounded-full mt-1" />
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
