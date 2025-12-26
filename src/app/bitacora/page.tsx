import { Suspense } from 'react';
import { getServerBitacora } from '@/lib/server-api';
import { BitacoraClient } from '@/components/bitacora/BitacoraClient';
import { BitacoraSkeleton } from '@/components/bitacora/BitacoraSkeleton';

export const revalidate = 30;

export default async function BitacoraPage() {
    const initialData = await getServerBitacora(100);

    return (
        <Suspense fallback={<BitacoraSkeleton />}>
            <BitacoraClient initialData={initialData} />
        </Suspense>
    );
}
