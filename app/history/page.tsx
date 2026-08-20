import HistoryPageClient from '@/components/HistoryPageClient';
import { AccessDeniedScreen } from '@/components/AccessDeniedScreen';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const emailIdParam = typeof params.emailId === 'string' ? params.emailId.trim() : '';
  const emailParam = typeof params.email === 'string' ? params.email.trim() : '';
  // Strict global guard: the email must come from the current URL search params only.
  const email = emailIdParam || emailParam;
  if (!email) {
    return <AccessDeniedScreen />;
  }
  return <HistoryPageClient email={email} />;
}
