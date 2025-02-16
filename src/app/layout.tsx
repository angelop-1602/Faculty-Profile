import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Loading } from '@/components/ui/loading'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Faculty Research Portfolio - CPRINT',
  description: 'SPUP Faculty Research Portfolio Management System',
  icons: {
    icon: [
      {
        url: '/images/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/images/icon-32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/images/icon-16.png',
        type: 'image/png',
        sizes: '16x16',
      }
    ],
    apple: {
      url: '/images/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    shortcut: '/images/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/icon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/images/icon-16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" sizes="180x180" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Suspense fallback={<Loading fullScreen message="Loading application..." />}>
            {children}
          </Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
} 