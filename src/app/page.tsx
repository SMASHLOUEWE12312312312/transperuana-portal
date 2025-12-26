import { Suspense } from 'react';
import { getServerDashboard } from '@/lib/server-api';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

// Revalidar datos cada 30 segundos
export const revalidate = 30;

export default async function DashboardPage() {
  // Fetch en el servidor - sin CORS, mucho más rápido
  const initialData = await getServerDashboard();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
