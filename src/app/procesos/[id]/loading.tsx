export default function ProcesoDetalleLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Breadcrumb */}
            <div className="h-4 w-32 bg-gray-200 rounded"></div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-64 bg-gray-100 rounded"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div>
                                <div className="h-3 w-16 bg-gray-100 rounded"></div>
                                <div className="h-5 w-24 bg-gray-200 rounded mt-1"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-3 gap-6">
                <div className="card p-6">
                    <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between">
                                <div className="h-4 w-32 bg-gray-100 rounded"></div>
                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card p-6 col-span-2">
                    <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i}>
                                <div className="h-3 w-20 bg-gray-100 rounded"></div>
                                <div className="h-5 w-32 bg-gray-200 rounded mt-1"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
