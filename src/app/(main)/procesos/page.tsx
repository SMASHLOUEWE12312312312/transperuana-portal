import { Suspense } from 'react';
import { getServerProcesos } from '@/lib/server-api';
import { ProcesosClient } from '@/components/procesos/ProcesosClient';
import { ProcesosSkeleton } from '@/components/procesos/ProcesosSkeleton';

export const dynamic = 'force-dynamic';

export default async function ProcesosPage() {
    const initialData = await getServerProcesos(200);

    return (
        <Suspense fallback={<ProcesosSkeleton />}>
            <ProcesosClient initialData={initialData} />
        </Suspense>
    );
}
