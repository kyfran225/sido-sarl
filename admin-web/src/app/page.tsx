/* ============================
   PAGE PRINCIPALE / DASHBOARD
============================ */
import { Metadata } from 'next'
import { ReactNode } from 'react'

/* ============================
   COMPOSANTS
============================ */
import { Dashboard } from '@/components/Dashboard'

/* ============================
   MÉTADONNÉES SEO
============================ */
export const metadata: Metadata = {
  title: 'SIDO Admin - Dashboard',
  description: "Tableau de bord de l'administration SIDO SARL",
}

/* ============================
   PAGE DASHBOARD
============================ */
export default function Page() {
  return (
    <section className="p-6 min-h-screen bg-gray-50">
      {/* Dashboard principal */}
      <Dashboard />
    </section>
  )
}
