import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Poppins } from 'next/font/google'
import './globals.css'
import { ArenaEmailProvider } from '@/components/arena-email-provider'
import { getArenaEmailId } from '@/lib/arena-email'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'LinkedIn Intelligence',
  description:
    'Search LinkedIn people and companies, then analyze post engagement — people, companies and posts intelligence in one dashboard.',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const emailId = await getArenaEmailId()
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-grey-50 text-grey-900 antialiased`}>
        <ArenaEmailProvider emailId={emailId}>{children}</ArenaEmailProvider>
      </body>
    </html>
  )
}
