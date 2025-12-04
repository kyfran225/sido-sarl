/* ============================
   FICHIER : src/app/layout.tsx
============================ */

'use client'  // Obligatoire pour Next.js 14 côté client

/* ============================
   IMPORTS
============================ */
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { QueryProvider } from '@/providers/QueryProvider'

/* ============================
   FONTS
============================ */
const inter = Inter({ subsets: ['latin'] })

/* ============================
   TYPES
============================ */
interface RootLayoutProps {
  children: React.ReactNode
}

/* ============================
   COMPOSANT ROOT LAYOUT
============================ */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* ============================
            QUERY PROVIDER GLOBAL
        ============================ */}
        <QueryProvider>
          {/* ============================
              NAVIGATION
          ============================ */}
          <Navigation />

          {/* ============================
              CONTENU PRINCIPAL
          ============================ */}
          <main className="bg-sido-bg min-h-screen">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  )
}
