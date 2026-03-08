'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter, Trash2, RotateCcw, Calendar } from 'lucide-react'

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
  deleted_at: string | null
  event_tables: {
    vip_tables: { name: string }
    events: { name: string; date: string }
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  attended:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmé',
  attended:  'Venu',
  cancelled: 'Annulé',
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [deleted, setDeleted] = useState<Reservation[]>([])
  const [filtered, setFiltered] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active')
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

    const { data: active } = await supabase
      .from('reservations')
      .select('*, event_tables(*, vip_tables(name), events(name, date))')
      .eq('venue_id', venue.id)
      .is('deleted_at', null)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: trash } = await supabase
      .from('reservations')
      .select('*, event_tables(*, vip_tables(name), events(name, date))')
      .eq('venue_id', venue.id)
      .not('deleted_at', 'is', null)
      .gte('deleted_at', sevenDaysAgo.toISOString())
      .order('deleted_at', { ascending: false })

    // Trier par date de soirée décroissante
    const sorted = (active || []).sort((a, b) => {
      const dateA = a.event_tables?.events?.date || ''
      const dateB = b.event_tables?.events?.date || ''
      return dateB.localeCompare(dateA)
    })

    setReservations(sorted)
    setDeleted(trash || [])
    setFiltered(sorted)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('reservations').update({ status }).eq('id', id)
    await loadData()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette réservation ? Elle sera conservée 7 jours dans la corbeille.')) return
    await supabase.from('reservations').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (selected?.id === id) setSelected(null)
    await loadData()
  }

  const handleRestore = async (id: string) => {
    await supabase.from('reservations').update({ deleted_at: null }).eq('id', id)
    await loadData()
  }

  const getDaysLeft = (deletedAt: string) => {
    const expiry = new Date(new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000)
    return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatDateHeader = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatPrice = (cents: number) => cents ? `${(cents / 100).toFixed(0)}€` : '—'

  // Grouper les réservations filtrées par date de soirée
  const groupedFiltered = filtered.reduce<Record<string, Reservation[]>>((acc, r) => {
    const date = r.event_tables?.events?.date || 'unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(r)
    return acc
  }, {})
  const sortedDates = Object.keys(groupedFiltered).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Réservations</h2>
        <p className="text-zinc-400 mt-1">Gérez toutes vos réservations</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('active'); setSelected(null) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'active' ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>
          Réservations
          {reservations.length > 0 && (
            <span className="ml-2 bg-white/10 text-white text-xs px-1.5 py-0.5 rounded-full">{reservations.length}</span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('trash'); setSelected(null) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'trash' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>
          Corbeille
          {deleted.length > 0 && (
            <span className="ml-2 bg-white/10 text-white text-xs px-1.5 py-0.5 rounded-full">{deleted.length}</span>
          )}
        </button>
      </div>

      {/* ONGLET ACTIF */}
      {activeTab === 'active' && (
        <>
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
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm">
                <option value="all">Tous les statuts</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="text-zinc-500 text-center py-12">Chargement...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <p className="text-zinc-400">Aucune réservation trouvée</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {sortedDates.map(date => (
                    <div key={date}>
                      {/* En-tête de date */}
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar size={14} className="text-zinc-500 shrink-0" />
                        <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wide capitalize">
                          {date === 'unknown' ? 'Date inconnue' : formatDateHeader(date)}
                        </p>
                        <div className="flex-1 h-px bg-zinc-800" />
                        <span className="text-zinc-600 text-xs shrink-0">{groupedFiltered[date].length} rés.</span>
                      </div>

                      <div className="space-y-3">
                        {groupedFiltered[date].map(r => (
                          <div key={r.id}
                            className={`w-full bg-zinc-900 border rounded-2xl p-4 transition ${selected?.id === r.id ? 'border-purple-500' : 'border-zinc-800'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <button className="flex-1 min-w-0 text-left" onClick={() => setSelected(r)}>
                                <p className="text-white font-medium truncate">{r.client_name}</p>
                                <p className="text-zinc-500 text-sm truncate">
                                  {r.event_tables?.vip_tables?.name} — {r.event_tables?.events?.name}
                                </p>
                              </button>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                                    {STATUS_LABELS[r.status] || r.status}
                                  </span>
                                  <p className="text-zinc-400 text-sm mt-1">{formatPrice(r.deposit_amount)}</p>
                                </div>
                                <button
                                  onClick={() => handleDelete(r.id)}
                                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                    <div className="bg-zinc-800 rounded-xl p-3 mb-4">
                      <p className="text-zinc-400 text-xs font-semibold uppercase mb-1">Demande spéciale</p>
                      <p className="text-zinc-300 text-sm">{selected.special_request}</p>
                    </div>
                  )}

                  <div className="mb-4">
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
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm">
                    <Trash2 size={14} /> Supprimer la réservation
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ONGLET CORBEILLE */}
      {activeTab === 'trash' && (
        <div>
          {deleted.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Trash2 size={40} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">La corbeille est vide</p>
              <p className="text-zinc-600 text-sm mt-1">Les réservations supprimées apparaissent ici pendant 7 jours</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deleted.map(r => (
                <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 opacity-70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{r.client_name}</p>
                      <p className="text-zinc-500 text-sm truncate">
                        {r.event_tables?.vip_tables?.name} — {r.event_tables?.events?.name}
                      </p>
                      <p className="text-red-400/60 text-xs mt-0.5">
                        Suppression définitive dans {r.deleted_at ? getDaysLeft(r.deleted_at) : 0} jour(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                      <button
                        onClick={() => handleRestore(r.id)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-green-400 hover:bg-zinc-800 transition">
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
