'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  CalendarDays,
  Wine,
  Armchair,
  Settings,
  LogOut,
  Menu,
  X,
  Users
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/events', label: 'Soirées', icon: CalendarDays },
  { href: '/dashboard/tables', label: 'Carrés VIP', icon: Armchair },
  { href: '/dashboard/drinks', label: 'Carte boissons', icon: Wine },
  { href: '/dashboard/reservations', label: 'Réservations', icon: Users },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [venueName, setVenueName] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getVenue = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('venues')
        .select('name')
        .eq('user_id', user.id)
        .single()
      if (data) setVenueName(data.name)
    }
    getVenue()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">NightBook</h1>
        <p className="text-zinc-400 text-sm mt-1 truncate">{venueName}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                active
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition w-full"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col fixed h-full">
        <Sidebar />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        {/* Top bar mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-zinc-800 bg-zinc-900">
          <h1 className="text-white font-bold">NightBook</h1>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
