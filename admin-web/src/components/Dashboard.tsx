'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { RecentTransactions } from '@/components/RecentTransactions'
import { ClientStats } from '@/components/ClientStats'

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // This would be a real dashboard stats endpoint
      // For now, we'll simulate with existing endpoints
      const [transactionsRes, clientsRes] = await Promise.all([
        apiClient.get('/transactions?limit=100'),
        apiClient.get('/clients?limit=1000')
      ])

      const transactions = transactionsRes.data.data || []
      const clients = clientsRes.data.data || []

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayTransactions = transactions.filter((t: any) =>
        new Date(t.createdAt) >= today
      )

      const totalRevenue = transactions.reduce((sum: number, t: any) => sum + t.amountFCFA, 0)
      const todayRevenue = todayTransactions.reduce((sum: number, t: any) => sum + t.amountFCFA, 0)

      return {
        totalTransactions: transactions.length,
        todayTransactions: todayTransactions.length,
        totalClients: clients.length,
        totalRevenue,
        todayRevenue,
        activeClients: clients.filter((c: any) => c.segment !== 'inactive').length
      }
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sido-green"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de Bord</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Transactions Aujourd'hui"
            value={stats?.todayTransactions || 0}
            icon="💰"
            color="blue"
          />
          <StatCard
            title="Total Transactions"
            value={stats?.totalTransactions || 0}
            icon="📊"
            color="green"
          />
          <StatCard
            title="Clients Actifs"
            value={stats?.activeClients || 0}
            icon="👥"
            color="yellow"
          />
          <StatCard
            title="Revenus Aujourd'hui"
            value={`${stats?.todayRevenue?.toLocaleString('fr-FR') || 0} FCFA`}
            icon="💵"
            color="purple"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Transactions Récentes">
            <RecentTransactions />
          </Card>

          <Card title="Statistiques Clients">
            <ClientStats />
          </Card>
        </div>
      </div>
    </div>
  )
}
