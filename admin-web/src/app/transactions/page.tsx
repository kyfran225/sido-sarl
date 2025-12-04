'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Transaction {
  _id: string
  auditId: string
  clientSid: string
  amountFCFA: number
  litres: number
  pointsAwarded: number
  serverTimestamp: string
  pompisteId: string
  stationId: string
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? { search: searchTerm } : {}
      const response = await apiClient.get('/transactions', { params })
      return response.data.data || []
    }
  })

  const handleCancelTransaction = async (transactionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette transaction ?')) return

    try {
      await apiClient.delete(`/transactions/${transactionId}`)
      refetch()
      alert('Transaction annulée avec succès')
    } catch (error) {
      alert('Erreur lors de l\'annulation de la transaction')
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Transactions</h1>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <Input
              placeholder="Rechercher par SID client, montant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Transactions Table */}
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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SID Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Litres
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Station
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions?.map((transaction: Transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.serverTimestamp).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.clientSid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.amountFCFA.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.litres} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.pointsAwarded}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.stationId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            Détails
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelTransaction(transaction._id)}
                          >
                            Annuler
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

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Détails de la Transaction
                </h3>
                <div className="space-y-3">
                  <div><strong>ID:</strong> {selectedTransaction._id}</div>
                  <div><strong>Audit ID:</strong> {selectedTransaction.auditId}</div>
                  <div><strong>Client SID:</strong> {selectedTransaction.clientSid}</div>
                  <div><strong>Montant:</strong> {selectedTransaction.amountFCFA} FCFA</div>
                  <div><strong>Litres:</strong> {selectedTransaction.litres}</div>
                  <div><strong>Points:</strong> {selectedTransaction.pointsAwarded}</div>
                  <div><strong>Date:</strong> {new Date(selectedTransaction.serverTimestamp).toLocaleString('fr-FR')}</div>
                  <div><strong>Station:</strong> {selectedTransaction.stationId}</div>
                  <div><strong>Pompiste:</strong> {selectedTransaction.pompisteId}</div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setSelectedTransaction(null)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
