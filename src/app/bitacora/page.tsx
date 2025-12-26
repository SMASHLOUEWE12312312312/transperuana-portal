import { Suspense } from 'react';
import { getServerBitacora } from '@/lib/server-api';
import { BitacoraClient } from '@/components/bitacora/BitacoraClient';
import { BitacoraSkeleton } from '@/components/bitacora/BitacoraSkeleton';

export const dynamic = 'force-static';
export const revalidate = 60;

export default async function BitacoraPage() {
    const initialData = await getServerBitacora(100);

    return (
        <Suspense fallback={<BitacoraSkeleton />}>
            <BitacoraClient initialData={initialData} />
        </Suspense>
    );
}
