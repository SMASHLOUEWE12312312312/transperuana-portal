import { Suspense } from 'react';
import { getServerConfig } from '@/lib/server-api';
import { ConfiguracionClient } from '@/components/configuracion/ConfiguracionClient';
import { ConfiguracionSkeleton } from '@/components/configuracion/ConfiguracionSkeleton';

export const revalidate = 30;

export default async function ConfiguracionPage() {
    const initialData = await getServerConfig();

    return (
        <Suspense fallback={<ConfiguracionSkeleton />}>
            <ConfiguracionClient initialData={initialData} />
        </Suspense>
    );
}
