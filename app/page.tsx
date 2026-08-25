import { getArenaEmailId } from '@/lib/arena-email';
import { AccessDeniedScreen } from '@/components/AccessDeniedScreen';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const email = await getArenaEmailId();
  if (!email) {
    return <AccessDeniedScreen />;
  }
  return <DashboardClient email={email} />;
}
