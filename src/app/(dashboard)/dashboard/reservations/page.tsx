'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter } from 'lucide-react'

type Reservation = {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  guest_count: number
  special_request: string
  status: string
  deposit_amount: number
  created_at: string
  estimated_budget: number
  event_tables: {
    vip_tables: { name: string }
    events: { name: string; date: string }
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  present: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  noshow: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  present: 'Présent',
  noshow: 'No-show',
  cancelled: 'Annulé',
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filtered, setFiltered] = useState<Reservation[]>([])
  const [venueId, setVenueId] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = reservations
    if (search) result = result.filter(r =>
      r.client_name.toLowerCase().includes(search.toLowerCase()) ||
      r.client_email.toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter)
    setFiltered(result)
  }, [search, statusFilter, reservations])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: venue } = await supabase.from('venues').select('id').eq('user_id', user.id).single()
    if (!venue) return
    setVenueId(venue.id)
    const { data } = await supabase
      .from('reservations')
      .select('*, event_tables(*, vip_tables(name), events(name, date))')
      .eq('venue_id', venue.id)
      .order('created_at', { ascending: false })
    setReservations(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('reservations').update({ status }).eq('id', id)
    await loadData()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatPrice = (cents: number) => cents ? `${(cents / 100).toFixed(0)}€` : '—'

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Réservations</h2>
        <p className="text-zinc-400 mt-1">Gérez toutes vos réservations</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition text-sm"
            placeholder="Rechercher un client..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Liste */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-zinc-500 text-center py-12">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <p className="text-zinc-400">Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full bg-zinc-900 border rounded-2xl p-4 text-left transition hover:border-purple-500/50 ${selected?.id === r.id ? 'border-purple-500' : 'border-zinc-800'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{r.client_name}</p>
                      <p className="text-zinc-500 text-sm truncate">
                        {r.event_tables?.vip_tables?.name} — {r.event_tables?.events?.name}
                      </p>
                      <p className="text-zinc-600 text-xs mt-0.5">
                        {r.event_tables?.events?.date && formatDate(r.event_tables.events.date)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      <p className="text-zinc-400 text-sm mt-1">{formatPrice(r.deposit_amount)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détail */}
        {selected && (
          <div className="w-80 shrink-0 hidden lg:block">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Détail</h3>
                <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-white text-lg leading-none">×</button>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: 'Client', value: selected.client_name },
                  { label: 'Email', value: selected.client_email },
                  { label: 'Téléphone', value: selected.client_phone || '—' },
                  { label: 'Personnes', value: `${selected.guest_count} pers.` },
                  { label: 'Soirée', value: selected.event_tables?.events?.name },
                  { label: 'Date', value: selected.event_tables?.events?.date ? formatDate(selected.event_tables.events.date) : '—' },
                  { label: 'Carré', value: selected.event_tables?.vip_tables?.name },
                  { label: 'Budget estimé', value: formatPrice(selected.estimated_budget) },
                  { label: 'Acompte', value: formatPrice(selected.deposit_amount) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-white text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              {selected.special_request && (
                <div className="bg-zinc-800 rounded-xl p-3 mb-5">
                  <p className="text-zinc-400 text-xs font-semibold uppercase mb-1">Demande spéciale</p>
                  <p className="text-zinc-300 text-sm">{selected.special_request}</p>
                </div>
              )}

              <div>
                <p className="text-zinc-400 text-xs font-semibold uppercase mb-2">Changer le statut</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selected.id, status)}
                      className={`text-xs py-2 px-3 rounded-lg border transition ${
                        selected.status === status
                          ? STATUS_COLORS[status] + ' font-semibold'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
