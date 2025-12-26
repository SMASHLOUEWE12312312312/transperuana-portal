import { Suspense } from 'react';
import { getServerErrores } from '@/lib/server-api';
import { ErroresClient } from '@/components/errores/ErroresClient';
import { ErroresSkeleton } from '@/components/errores/ErroresSkeleton';

export const revalidate = 30;

export default async function ErroresPage() {
    const initialData = await getServerErrores(500);

    return (
        <Suspense fallback={<ErroresSkeleton />}>
            <ErroresClient initialData={initialData} />
        </Suspense>
    );
}
