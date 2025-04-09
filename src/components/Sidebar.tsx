'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Map,
  ShoppingCart,
  Menu,
  X,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Clientes', href: '/clientes', icon: <Users size={20} /> },
  { label: 'Lotes', href: '/lotes', icon: <Map size={20} /> },
  { label: 'Ventas', href: '/ventas', icon: <ShoppingCart size={20} /> },
  { label: 'Gastos', href: '/flujocaja', icon: <DollarSign size={20} /> },
  // { label: 'Pagos', href: '/pagos', icon: <CreditCard size={20} /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }
  
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

    return (
    <>
      {/* Botón hamburguesa en móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? 'w-64' : 'w-16'}
          bg-gray-900 text-white h-screen p-4 pt-6 fixed top-0 left-0 transition-all duration-300 z-40
        `}
      >
        <div className="flex items-center justify-between mb-10 px-2">
          <span className={`text-xl font-bold tracking-wide transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            🏡 Lago de Como
          </span>
        </div>

        <nav className="flex flex-col gap-2 mt-4">
          {menuItems.map(({ label, href, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                  ${isActive ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-800 text-gray-300'}
                `}
              >
                {icon}
                <span className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}