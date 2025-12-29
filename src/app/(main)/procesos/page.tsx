import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getServerProcesos } from '@/lib/server-api';
import { ProcesosClient } from '@/components/procesos/ProcesosClient';
import { ProcesosSkeleton } from '@/components/procesos/ProcesosSkeleton';

export const dynamic = 'force-dynamic';

export default async function ProcesosPage() {
    // Obtener sesión para filtrar por ejecutivo
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const userEmail = session.user.email;
    const userRole = (session.user as { role?: string }).role || 'EJECUTIVO';

    // ADMIN ve todos, EJECUTIVO ve solo los suyos
    const ownerEmail = userRole === 'ADMIN' ? 'ALL' : userEmail;

    const initialData = await getServerProcesos(200, ownerEmail);

    return (
        <Suspense fallback={<ProcesosSkeleton />}>
            <ProcesosClient
                initialData={initialData}
                userRole={userRole}
                userEmail={userEmail}
            />
        </Suspense>
    );
}
