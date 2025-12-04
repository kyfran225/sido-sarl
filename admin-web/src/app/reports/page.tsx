/* ============================
   PAGE RAPPORTS & ANALYSES
   - Composant client (use client)
   - Typage fort, garde contre undefined, sécurité des appels API
============================ */
'use client'

/* ============================
   IMPORTS
============================ */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/* ============================
   TYPES
============================ */
interface ReportData {
  totalTransactions: number
  totalRevenue: number
  totalPointsAwarded: number
  clientStats: {
    totalClients: number
    activeClients: number
    segmentBreakdown: Record<string, number>
  }
  stationStats: Array<{
    stationId: string
    stationName: string
    transactions: number
    revenue: number
    clients: number
  }>
  dailyStats: Array<{
    date: string
    transactions: number
    revenue: number
    points: number
  }>
}

/* ============================
   UTIL - parseResponse
   - Gère les formes : axios-like (res.data) ou fetch-like (res)
============================ */
function parseApiResponse<T = any>(res: any): T | null {
  if (!res) return null
  // axios style: { data: ... }
  if (res.data !== undefined) return res.data
  // direct body
  return res as T
}

/* ============================
   COMPOSANT PRINCIPAL
============================ */
export default function ReportsPage() {
  /* ============================
     STATE : plage de dates (YYYY-MM-DD)
  ============================ */
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  /* ============================
     REACT QUERY : fetch des rapports
     - Typage explicite <ReportData | null>
     - queryKey inclut la plage pour revalidation automatique
  ============================ */
  const { data: reportRaw, isLoading, refetch } = useQuery<ReportData | null>({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      // Si apiClient est un axios-like client, il retourne { data: ... }
      // Si c'est un fetch wrapper, on s'adapte avec parseApiResponse
      const response = await apiClient.get('/reports', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      })
      return (parseApiResponse(response) as any)?.data ?? parseApiResponse(response)
    },
    // Optionnel: ne pas refetch automatique au focus pour éviter charges inutiles
    refetchOnWindowFocus: false
  })

  const report = reportRaw ?? null

  /* ============================
     EXPORT CSV (placeholder)
     - Ici on peut appeler une route d'export qui renvoie un CSV
     - Exemple : window.open(`${BASE_URL}/reports/export?type=${type}&...`)
  ============================ */
  const handleExportCSV = (type: string) => {
    // Placeholder : ouvrir une nouvelle fenêtre vers l'endpoint d'export
    // Remplacer par la route réelle de ton backend quand disponible
    const url = `/api/reports/export?type=${encodeURIComponent(type)}&startDate=${encodeURIComponent(
      dateRange.startDate
    )}&endDate=${encodeURIComponent(dateRange.endDate)}`
    // Ouvre dans un nouvel onglet (si backend renvoie un fichier, le navigateur le déclenchera)
    window.open(url, '_blank')
  }

  /* ============================
     RENDU
  ============================ */
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header + actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rapports et Analyses</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => handleExportCSV('transactions')}>
              📊 Export Transactions
            </Button>
            <Button variant="outline" onClick={() => handleExportCSV('clients')}>
              👥 Export Clients
            </Button>
          </div>
        </div>

        {/* Filtre : plage de dates */}
        <Card className="mb-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <Button onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </Card>

        {/* Contenu principal */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sido-green" />
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sido-green">
                    {Number(report.totalTransactions || 0).toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sido-blue">
                    {Number(report.totalRevenue || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-sm text-gray-600">Revenus Totaux</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sido-yellow">
                    {Number(report.totalPointsAwarded || 0).toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm text-gray-600">Points Attribués</div>
                </div>
              </Card>
            </div>

            {/* Client Stats */}
            <Card title="Statistiques Clients">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    {report.clientStats?.totalClients ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-green-600">
                    {report.clientStats?.activeClients ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Clients Actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-blue-600">
                    {report.clientStats?.totalClients
                      ? `${Math.round(
                          ((report.clientStats.activeClients ?? 0) /
                            (report.clientStats.totalClients ?? 1)) *
                            100
                        )}%`
                      : '0%'}
                  </div>
                  <div className="text-sm text-gray-600">Taux d&apos;Activité</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Répartition par Segment</h4>
                <div className="space-y-2">
                  {report.clientStats?.segmentBreakdown &&
                  Object.keys(report.clientStats.segmentBreakdown).length > 0 ? (
                    Object.entries(report.clientStats.segmentBreakdown).map(([segment, count]) => (
                      <div key={segment} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">{segment}</span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Aucune répartition disponible.</div>
                  )}
                </div>
              </div>
            </Card>

            {/* Station Performance */}
            <Card title="Performance par Station">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Station
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clients
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(report.stationStats) && report.stationStats.length > 0 ? (
                      report.stationStats.map((station) => (
                        <tr key={station.stationId ?? station.stationName}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {station.stationName ?? '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Number(station.transactions ?? 0).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Number(station.revenue ?? 0).toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Number(station.clients ?? 0).toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 text-center">
                          Aucune donnée par station.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Daily Trends */}
            <Card title="Évolution Quotidienne">
              <div className="h-64 flex items-center justify-center text-gray-500">
                📈 Graphique d&apos;évolution quotidienne - Intégration Chart.js à implémenter
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune donnée disponible pour la période sélectionnée.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
