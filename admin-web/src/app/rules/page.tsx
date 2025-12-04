'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/* ============================
   TYPES
============================ */

interface Rule {
  _id: string
  name: string
  description: string
  type: 'points_per_liter' | 'bonus_threshold' | 'segment_multiplier'
  conditions: {
    minAmount?: number
    maxAmount?: number
    segment?: string
    stationId?: string
  }
  actions: {
    pointsAwarded?: number
    multiplier?: number
    bonusType?: string
  }
  priority: number
  isActive: boolean
  effectiveFrom: string
  effectiveTo?: string
}

type RuleType = 'points_per_liter' | 'bonus_threshold' | 'segment_multiplier'

/* ============================
   COMPOSANT PRINCIPAL : RulesPage
============================ */

export default function RulesPage() {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/rules')
      return response.data.data as Rule[]
    }
  })

  const createRuleMutation = useMutation({
    mutationFn: (ruleData: Omit<Rule, '_id'>) => apiClient.post('/admin/rules', ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      setShowCreateForm(false)
    }
  })

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Rule> }) =>
      apiClient.put(`/admin/rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      setSelectedRule(null)
    }
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    }
  })

  const handleCreateRule = (ruleData: Omit<Rule, '_id'>) => {
    createRuleMutation.mutate(ruleData)
  }

  const handleUpdateRule = (id: string, data: Partial<Rule>) => {
    updateRuleMutation.mutate({ id, data })
  }

  const handleDeleteRule = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      deleteRuleMutation.mutate(id)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Règles</h1>
          <Button onClick={() => setShowCreateForm(true)}>
            Nouvelle Règle
          </Button>
        </div>

        {/* Rules List */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sido-green"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rules?.map((rule) => (
                    <tr key={rule._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                          <div className="text-sm text-gray-500">{rule.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          rule.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {rule.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRule(rule)}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteRule(rule._id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Create/Edit Rule Modal */}
        {(showCreateForm || selectedRule) && (
          <RuleFormModal
            rule={selectedRule}
            onClose={() => {
              setShowCreateForm(false)
              setSelectedRule(null)
            }}
            onSubmit={selectedRule ? (data) => handleUpdateRule(selectedRule._id, data) : handleCreateRule}
          />
        )}
      </div>
    </div>
  )
}

/* ============================
   COMPOSANT MODAL : RuleFormModal
============================ */

function RuleFormModal({
  rule,
  onClose,
  onSubmit
}: {
  rule?: Rule | null
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    type: rule?.type || 'points_per_liter',
    conditions: rule?.conditions || {},
    actions: rule?.actions || {},
    priority: rule?.priority || 1,
    isActive: rule?.isActive ?? true,
    effectiveFrom: rule?.effectiveFrom || new Date().toISOString().split('T')[0]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {rule ? 'Modifier la Règle' : 'Nouvelle Règle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as RuleType
                  })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="points_per_liter">Points par litre</option>
                <option value="bonus_threshold">Seuil de bonus</option>
                <option value="segment_multiplier">Multiplicateur segment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priorité</label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                min="1"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-sido-green focus:ring-sido-green border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Actif</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">
                {rule ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
