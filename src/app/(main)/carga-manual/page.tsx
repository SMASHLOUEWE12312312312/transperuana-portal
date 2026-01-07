import { Suspense } from 'react';
import { CargaManualClient } from '@/components/carga-manual/CargaManualClient';
import { Upload } from 'lucide-react';

export const metadata = {
    title: 'Carga Manual | Portal ETL',
    description: 'Procesar archivos Excel de forma manual'
};

function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-4 bg-gray-200 rounded w-96" />
            <div className="card p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                </div>
                <div className="h-48 bg-gray-200 rounded" />
            </div>
        </div>
    );
}

export default function CargaManualPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#CD3529]/10 rounded-lg">
                        <Upload size={24} className="text-[#CD3529]" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Carga Manual</h1>
                </div>
                <p className="text-gray-500">
                    Procesa archivos Excel directamente sin usar el flujo de correos
                </p>
            </div>

            {/* Content */}
            <Suspense fallback={<LoadingSkeleton />}>
                <CargaManualClient />
            </Suspense>
        </div>
    );
}
