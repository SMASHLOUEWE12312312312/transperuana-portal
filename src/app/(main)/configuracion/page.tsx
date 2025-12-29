import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getServerConfig } from '@/lib/server-api';
import { ConfiguracionClient } from '@/components/configuracion/ConfiguracionClient';
import { ConfiguracionSkeleton } from '@/components/configuracion/ConfiguracionSkeleton';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const userRole = (session.user as { role?: string }).role;

    if (userRole !== 'ADMIN') {
        redirect('/');
    }

    const initialData = await getServerConfig();

    return (
        <Suspense fallback={<ConfiguracionSkeleton />}>
            <ConfiguracionClient initialData={initialData} />
        </Suspense>
    );
}
