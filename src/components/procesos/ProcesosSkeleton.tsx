export function ProcesosSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-28 bg-gray-200 rounded" />
                    <div className="h-4 w-72 bg-gray-100 rounded mt-2" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                </div>
            </div>

            {/* Filters Skeleton */}
            <div className="card p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="h-10 w-64 bg-gray-200 rounded-lg" />
                    <div className="h-10 w-32 bg-gray-200 rounded-lg" />
                    <div className="h-10 w-32 bg-gray-200 rounded-lg" />
                    <div className="h-10 w-32 bg-gray-200 rounded-lg" />
                    <div className="h-10 w-32 bg-gray-200 rounded-lg" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="card overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-12 bg-gray-200 rounded" />
                    <div className="h-4 w-12 bg-gray-200 rounded" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>

                {/* Table Rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div key={i} className="px-4 py-4 border-b flex items-center gap-4">
                        <div className="h-4 w-20 bg-gray-100 rounded" />
                        <div className="h-4 w-24 bg-gray-100 rounded" />
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                        <div className="h-6 w-16 bg-gray-200 rounded-full" />
                        <div className="h-6 w-24 bg-gray-200 rounded-full" />
                        <div className="h-4 w-8 bg-gray-100 rounded" />
                        <div className="h-4 w-8 bg-gray-100 rounded" />
                        <div className="h-4 w-12 bg-gray-100 rounded" />
                        <div className="flex gap-1">
                            <div className="h-8 w-8 bg-gray-100 rounded" />
                            <div className="h-8 w-8 bg-gray-100 rounded" />
                        </div>
                    </div>
                ))}

                {/* Pagination Skeleton */}
                <div className="px-4 py-3 flex items-center justify-between border-t">
                    <div className="h-4 w-40 bg-gray-100 rounded" />
                    <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
