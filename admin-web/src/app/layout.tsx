/* ============================
   LAYOUT PRINCIPAL DE L'APPLICATION
============================ */
import './globals.css'
import { ReactNode } from 'react'
import { Navigation } from '@/components/Navigation'
import { QueryProvider } from '@/providers/QueryProvider'

/* ============================
   TYPOGRAPHIE GLOBALE
============================ */
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

/* ============================
   ROOT LAYOUT
============================ */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <title>SIDO Admin - Programme de Fidélisation Points Verts</title>
        <meta
          name="description"
          content="Interface d'administration SIDO SARL"
        />
      </head>
      <body className={inter.className}>
        {/* Provider pour les requêtes API et cache global */}
        <QueryProvider>
          {/* Navigation principale */}
          <Navigation />
          {/* Contenu de la page */}
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  )
}
