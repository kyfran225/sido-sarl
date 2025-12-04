"use client"

/* ============================
   BARRE DE NAVIGATION PRINCIPALE
============================ */
import { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ============================
   TYPES
============================ */
interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Clients', href: '/clients' },
  { label: 'Paramètres', href: '/settings' },
]

/* ============================
   COMPOSANT NAVIGATION
============================ */
export const Navigation: FC = () => {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-green-600">SIDO Admin</div>
      <ul className="flex space-x-6">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`hover:text-green-700 ${
                pathname === item.href ? 'text-green-800 font-semibold' : 'text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
