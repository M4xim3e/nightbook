'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, PauseCircle, Building2, LogOut } from 'lucide-react'

type Venue = {
  id: string
  name: string
  slug: string
  city: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: adminRecord } = await supabase
      .from('admins').select('id').eq('email', user.email).single()
    if (!adminRecord) { router.push('/dashboard'); return }
    setIsAdmin(true)
    const { data } = await supabase.from('venues').select('*').order('created_at', { ascending: false })
    setVenues(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const setStatus = async (venue: Venue, newStatus: string) => {
    const labels: Record<string, string> = { active: 'activer', paused: 'mettre en pause', suspended: 'suspendre' }
    if (!confirm(`Voulez-vous ${labels[newStatus]} "${venue.name}" ?`)) return

    const res = await fetch('/api/admin/set-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: venue.id, status: newStatus }),
    })

    if (!res.ok) {
      alert('Erreur lors de la mise à jour du statut')
      return
    }
    await loadData()
  }

  const stats = {
    total: venues.length,
    active: venues.filter(v => v.status === 'active').length,
    paused: venues.filter(v => v.status === 'paused').length,
    suspended: venues.filter(v => v.status === 'suspended').length,
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Actif', color: 'text-green-400', bg: 'bg-green-500/10' },
    paused: { label: 'En pause', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    suspended: { label: 'Suspendu', color: 'text-red-400', bg: 'bg-red-500/10' },
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Chargement...</p>
    </div>
  )
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">👑</span>
              </div>
              <h1 className="text-2xl font-bold text-white">NightBook Admin</h1>
            </div>
            <p className="text-zinc-500 text-sm ml-11">Gestion des etablissements</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin/prospects"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
              📣 Prospection
            </a>
            <button onClick={handleLogout}
              className="flex items-center gap-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 px-4 py-2.5 rounded-xl text-sm transition">
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Building2, color: 'text-white' },
            { label: 'Actifs', value: stats.active, icon: CheckCircle, color: 'text-green-400' },
            { label: 'En pause', value: stats.paused, icon: PauseCircle, color: 'text-yellow-400' },
            { label: 'Suspendus', value: stats.suspended, icon: XCircle, color: 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500 text-xs">{label}</span>
                <Icon size={14} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Liste venues */}
        <div className="space-y-3">
          {venues.map(venue => {
            const cfg = statusConfig[venue.status] || statusConfig.active
            return (
              <div key={venue.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold truncate">{venue.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>/{venue.slug}</span>
                      {venue.city && <span>📍 {venue.city}</span>}
                      <span>Inscrit le {new Date(venue.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {venue.status !== 'active' && (
                      <button onClick={() => setStatus(venue, 'active')}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium border border-green-500/30 text-green-400 hover:bg-green-500/10 transition">
                        Activer
                      </button>
                    )}
                    {venue.status !== 'paused' && (
                      <button onClick={() => setStatus(venue, 'paused')}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition">
                        Pause
                      </button>
                    )}
                    {venue.status !== 'suspended' && (
                      <button onClick={() => setStatus(venue, 'suspended')}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                        Suspendre
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
