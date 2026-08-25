import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import './globals.css';
import { ArenaEmailProvider } from '@/components/arena-email-provider';
import { getArenaEmailId } from '@/lib/arena-email';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'LinkedIn Intelligence',
  description: 'Search, select and analyze LinkedIn engagement — people, companies and post activity.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const emailId = await getArenaEmailId();
  return (
    <html lang="en">
      <body className={`${poppins.className} font-sans bg-grey-50 text-grey-900 antialiased`}>
        <ArenaEmailProvider emailId={emailId}>{children}</ArenaEmailProvider>
      </body>
    </html>
  );
}
