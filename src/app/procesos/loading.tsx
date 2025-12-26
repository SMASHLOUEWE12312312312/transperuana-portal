export default function ProcesosLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-48 bg-gray-100 rounded mt-2"></div>
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-4">
                        <div className="h-8 w-16 bg-gray-200 rounded mx-auto"></div>
                        <div className="h-4 w-20 bg-gray-100 rounded mx-auto mt-2"></div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-40 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="border-b border-gray-200 p-4">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="border-b border-gray-100 p-4">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4, 5, 6].map(j => (
                                <div key={j} className="h-4 bg-gray-100 rounded flex-1"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
