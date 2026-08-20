import HistoryPageClient from '@/components/HistoryPageClient';
import { getArenaEmailId } from '@/lib/arena-email';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const emailIdParam = typeof params.emailId === 'string' ? params.emailId.trim() : '';
  const emailParam = typeof params.email === 'string' ? params.email.trim() : '';
  const fromCookie = await getArenaEmailId();
  const email = emailIdParam || emailParam || fromCookie || '';
  return <HistoryPageClient email={email} />;
}
