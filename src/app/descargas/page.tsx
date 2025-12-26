import { Suspense } from 'react';
import { getServerDescargas } from '@/lib/server-api';
import { DescargasClient } from '@/components/descargas/DescargasClient';
import { DescargasSkeleton } from '@/components/descargas/DescargasSkeleton';

export const revalidate = 30;

export default async function DescargasPage() {
    const initialData = await getServerDescargas();

    return (
        <Suspense fallback={<DescargasSkeleton />}>
            <DescargasClient initialData={initialData} />
        </Suspense>
    );
}
