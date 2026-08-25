import DashboardClient from '@/components/DashboardClient';
import { getArenaEmailId } from '@/lib/arena-email';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const email = (await getArenaEmailId()) ?? '';
  return <DashboardClient email={email} />;
}
