'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

/* ============================
   COMPOSANT : ClientStats
============================ */

export function ClientStats() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['client-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/clients?limit=1000')
      return response.data.data || []
    }
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    )
  }

  /* ============================
     CALCUL DES SEGMENTS
  ============================ */
  const segments: Record<string, number> = clients?.reduce((acc: Record<string, number>, client: any) => {
    const seg = client.segment || 'unknown'
    acc[seg] = (acc[seg] || 0) + 1
    return acc
  }, {}) || {}

  /* ============================
     RENDU DES STATS
  ============================ */
  return (
    <div className="space-y-4">
      {Object.entries(segments).map(([segment, count]) => (
        <div key={segment} className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-3 ${
                segment === 'vip'
                  ? 'bg-purple-500'
                  : segment === 'premium'
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
              }`}
            ></div>
            <span className="text-sm font-medium text-gray-900 capitalize">
              {segment}
            </span>
          </div>
          <span className="text-sm text-gray-500">{count}</span>
        </div>
      ))}
    </div>
  )
}
