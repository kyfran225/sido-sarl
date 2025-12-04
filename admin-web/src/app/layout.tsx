import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { QueryProvider } from '@/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SIDO Admin - Programme de Fidélisation Points Verts',
  description: 'Interface d\'administration SIDO SARL',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <QueryProvider>
          <Navigation />
          <main className="bg-sido-bg min-h-screen">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  )
}
