/* ============================
   COMPOSANT DASHBOARD
============================ */
import { FC } from 'react'

/* ============================
   TYPES (si nécessaire)
============================ */
// Ajouter ici si props spécifiques sont nécessaires
interface DashboardProps {}

/* ============================
   COMPOSANT PRINCIPAL
============================ */
export const Dashboard: FC<DashboardProps> = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Carte 1 */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="text-lg font-semibold mb-2">Total Clients</h2>
        <p className="text-2xl font-bold">120</p>
      </div>
      {/* Carte 2 */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="text-lg font-semibold mb-2">Services Actifs</h2>
        <p className="text-2xl font-bold">32</p>
      </div>
      {/* Carte 3 */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="text-lg font-semibold mb-2">Points Verts Distribués</h2>
        <p className="text-2xl font-bold">5,400</p>
      </div>
    </div>
  )
}
