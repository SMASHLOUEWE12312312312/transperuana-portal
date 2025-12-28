import { Suspense } from 'react';
import { getServerDashboard } from '@/lib/server-api';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const initialData = await getServerDashboard();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
