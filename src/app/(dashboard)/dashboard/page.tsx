'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, Users, TrendingUp, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayReservations: 0,
    pendingReservations: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
  })
  const [recentReservations, setRecentReservations] = useState<any[]>([])
  const [venueName, setVenueName] = useState('')
  const [venueSlug, setVenueSlug] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: venue } = await supabase
        .from('venues')
        .select('id, name, slug')
        .eq('user_id', user.id)
        .single()

      if (!venue) return
      setVenueName(venue.name)
      setVenueSlug(venue.slug || '')

      const today = new Date().toISOString().split('T')[0]

      const { data: reservations } = await supabase
        .from('reservations')
        .select('*, event_tables(*, events(date, name), vip_tables(name))')
        .eq('venue_id', venue.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (reservations) {
        setRecentReservations(reservations)
        const todayRes = reservations.filter(r =>
          r.event_tables?.events?.date === today
        )
        const pending = reservations.filter(r => r.status === 'pending')
        const revenue = reservations
          .filter(r => r.stripe_payment_status === 'succeeded')
          .reduce((sum, r) => sum + (r.deposit_amount || 0), 0)

        setStats({
          todayReservations: todayRes.length,
          pendingReservations: pending.length,
          totalRevenue: revenue,
          upcomingEvents: 0,
        })
      }

      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venue.id)
        .gte('date', today)

      setStats(s => ({ ...s, upcomingEvents: count || 0 }))
    }
    load()
  }, [])

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    confirmed: 'bg-green-500/10 text-green-400',
    present: 'bg-blue-500/10 text-blue-400',
    noshow: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-zinc-500/10 text-zinc-400',
  }

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    present: 'Présent',
    noshow: 'No-show',
    cancelled: 'Annulé',
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Bonjour 👋</h2>
          <p className="text-zinc-400 mt-1">{venueName} — voici votre tableau de bord</p>
        </div>
        {venueSlug && (
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/reserve/${venueSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-purple-500 text-zinc-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shrink-0"
          >
            <ExternalLink size={15} />
            Lien client
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Réservations aujourd'hui", value: stats.todayReservations, icon: CalendarDays, color: 'text-purple-400' },
          { label: 'En attente', value: stats.pendingReservations, icon: Clock, color: 'text-yellow-400' },
          { label: 'Acomptes encaissés', value: `${(stats.totalRevenue / 100).toFixed(0)}€`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Soirées à venir', value: stats.upcomingEvents, icon: Users, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <Icon size={20} className={`${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-zinc-500 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Réservations récentes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Réservations récentes</h3>
          <Link href="/dashboard/events" className="text-purple-400 text-sm hover:text-purple-300">
            Voir tout →
          </Link>
        </div>

        {recentReservations.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-zinc-500">Aucune réservation pour l'instant</p>
            <Link href="/dashboard/events" className="text-purple-400 text-sm mt-2 inline-block hover:text-purple-300">
              Créer une soirée →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-white font-medium">{r.client_name}</p>
                  <p className="text-zinc-500 text-sm">
                    {r.event_tables?.vip_tables?.name} — {r.event_tables?.events?.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status]}`}>
                    {statusLabels[r.status]}
                  </span>
                  {r.deposit_amount && (
                    <p className="text-zinc-400 text-sm mt-1">{(r.deposit_amount / 100).toFixed(0)}€</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
