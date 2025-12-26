import { Suspense } from 'react';
import { getServerDashboard } from '@/lib/server-api';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

// ISR: Generar estáticamente, revalidar cada 60 segundos en background
export const dynamic = 'force-static';
export const revalidate = 60;

export default async function DashboardPage() {
  const initialData = await getServerDashboard();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
