import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { ArenaEmailProvider } from '@/components/arena-email-provider';
import { AccessDeniedScreen } from '@/components/AccessDeniedScreen';
import { getArenaEmailId } from '@/lib/arena-email';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'LinkedIn Intelligence',
  description: 'Engagement intelligence dashboard for LinkedIn company activity.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const emailId = await getArenaEmailId();
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ArenaEmailProvider emailId={emailId}>
          {emailId ? children : <AccessDeniedScreen />}
        </ArenaEmailProvider>
      </body>
    </html>
  );
}
