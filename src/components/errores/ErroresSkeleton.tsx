export function ErroresSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-80 bg-gray-100 rounded mt-2" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                    <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                </div>
            </div>

            {/* Error Summary Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="card p-4 text-center">
                        <div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" />
                        <div className="h-8 w-12 bg-gray-200 rounded mt-2 mx-auto" />
                    </div>
                ))}
            </div>

            {/* Search Skeleton */}
            <div className="flex flex-wrap gap-4">
                <div className="h-10 flex-1 min-w-[250px] bg-gray-200 rounded-lg" />
                <div className="h-10 w-40 bg-gray-200 rounded-lg" />
            </div>

            {/* Table Skeleton */}
            <div className="card overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-12 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>

                {/* Table Rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div key={i} className="px-4 py-4 border-b flex items-center gap-4">
                        <div className="h-4 w-20 bg-gray-100 rounded" />
                        <div className="h-4 w-24 bg-gray-100 rounded" />
                        <div className="h-4 w-8 bg-gray-100 rounded" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-6 w-32 bg-gray-100 rounded" />
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                        <div className="h-4 w-48 bg-gray-100 rounded" />
                    </div>
                ))}

                {/* Pagination Skeleton */}
                <div className="px-4 py-3 flex items-center justify-between border-t">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
