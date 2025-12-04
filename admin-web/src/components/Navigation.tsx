const navigation = [
  { name: 'Tableau de Bord', href: '/', icon: '📊' },
  { name: 'Clients', href: '/clients', icon: '👥' },
  { name: 'Transactions', href: '/transactions', icon: '💰' },
  { name: 'Règles', href: '/rules', icon: '⚙️' },
  { name: 'Rapports', href: '/reports', icon: '📈' },
  { name: 'Audit', href: '/audit', icon: '🔍' },
]

export function Navigation() {
  return (
    <nav className="bg-sido-primary text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="hover:bg-sido-secondary px-3 py-2 rounded"
            >
              {item.icon} {item.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
