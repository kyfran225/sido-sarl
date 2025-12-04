/* ============================
   BARRE D'ACCÈS RAPIDE
============================ */
import { FC } from 'react'

/* ============================
   COMPOSANT
============================ */
export const QuickAccessBar: FC = () => {
  const actions = [
    { label: 'Ajouter Service', icon: '➕', href: '/services/new' },
    { label: 'Voir Clients', icon: '👥', href: '/clients' },
    { label: 'Transactions', icon: '💳', href: '/transactions' },
  ]

  return (
    <div className="flex space-x-4 p-4 bg-gray-100 rounded shadow">
      {actions.map((action) => (
        <a
          key={action.label}
          href={action.href}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded shadow hover:bg-green-50 transition"
        >
          <span>{action.icon}</span>
          <span className="font-medium text-gray-800">{action.label}</span>
        </a>
      ))}
    </div>
  )
}
