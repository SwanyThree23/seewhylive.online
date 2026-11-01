import type { Metadata } from 'next'
import './globals.css'
import { BrandBar } from '@/components/brand/BrandBar'
import { BrandChyron } from '@/components/brand/BrandChyron'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'SeeWhy LIVE',
    template: '%s | SeeWhy LIVE',
  },
  description: 'The live streaming platform where creators earn 90% of every dollar.',
  openGraph: {
    type: 'website',
    siteName: 'SeeWhy LIVE',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {/* Brand signature — never remove or conditionally render */}
          <BrandBar />

          {/* Main content — padded for bar (2px top) and chyron (34px bottom) */}
          <main className="min-h-screen pt-[2px] pb-[34px]">
            {children}
          </main>

          {/* Brand chyron — never remove or conditionally render */}
          <BrandChyron />
        </Providers>
      </body>
    </html>
  )
}
