'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/reports', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      })
      return response.data.data as ReportData
    }
  })

  const handleExportCSV = (type: string) => {
    // In a real implementation, this would trigger a CSV download
    alert(`Export ${type} CSV - Fonctionnalité à implémenter`)
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
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

        {/* Date Range Filter */}
        <Card className="mb-6">
          <div className="flex gap-4 items-end">
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
            <Button onClick={() => refetch()}>
              Actualiser
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sido-green"></div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sido-green">
                    {report.totalTransactions.toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sido-blue">
                    {report.totalRevenue.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-sm text-gray-600">Revenus Totaux</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sido-yellow">
                    {report.totalPointsAwarded.toLocaleString('fr-FR')}
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
                    {report.clientStats.totalClients}
                  </div>
                  <div className="text-sm text-gray-600">Total Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-green-600">
                    {report.clientStats.activeClients}
                  </div>
                  <div className="text-sm text-gray-600">Clients Actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-blue-600">
                    {Math.round((report.clientStats.activeClients / report.clientStats.totalClients) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taux d&apos;Activité</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Répartition par Segment</h4>
                <div className="space-y-2">
                  {Object.entries(report.clientStats.segmentBreakdown).map(([segment, count]) => (
                    <div key={segment} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{segment}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                  ))}
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
                    {report.stationStats.map((station) => (
                      <tr key={station.stationId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {station.stationName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {station.transactions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {station.revenue.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {station.clients}
                        </td>
                      </tr>
                    ))}
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
