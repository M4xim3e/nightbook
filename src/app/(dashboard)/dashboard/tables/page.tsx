'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Armchair, Trash2, Link } from 'lucide-react'

type VipTable = {
  id: string
  name: string
  capacity: number
  min_spending: number
  description: string
  is_active: boolean
}

type Event = { id: string; name: string; date: string }

export default function TablesPage() {
  const [tables, setTables] = useState<VipTable[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [venueId, setVenueId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', capacity: '', min_spending: '', description: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: venue } = await supabase.from('venues').select('id').eq('user_id', user.id).single()
    if (!venue) return
    setVenueId(venue.id)
    const { data: tablesData } = await supabase.from('vip_tables').select('*').eq('venue_id', venue.id).order('min_spending')
    setTables(tablesData || [])
    const today = new Date().toISOString().split('T')[0]
    const { data: eventsData } = await supabase.from('events').select('id, name, date').eq('venue_id', venue.id).gte('date', today).order('date')
    setEvents(eventsData || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.name || !form.min_spending) return
    setSaving(true)
    await supabase.from('vip_tables').insert({
      venue_id: venueId,
      name: form.name,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      min_spending: Math.round(parseFloat(form.min_spending) * 100),
      description: form.description,
    })
    setForm({ name: '', capacity: '', min_spending: '', description: '' })
    setShowForm(false)
    await loadData()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce carré ?')) return
    await supabase.from('vip_tables').delete().eq('id', id)
    await loadData()
  }

  const handleAssign = async () => {
    if (!selectedEventId || selectedTableIds.length === 0) return
    setSaving(true)
    const inserts = selectedTableIds.map(tid => ({ event_id: selectedEventId, vip_table_id: tid, is_available: true }))
    await supabase.from('event_tables').upsert(inserts, { onConflict: 'event_id,vip_table_id' })
    setShowAssign(false)
    setSelectedEventId('')
    setSelectedTableIds([])
    setSaving(false)
    alert('Carrés assignés à la soirée ✅')
  }

  const toggleTable = (id: string) => {
    setSelectedTableIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Carrés VIP</h2>
          <p className="text-zinc-400 mt-1">Gérez vos espaces VIP et assignez-les à vos soirées</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAssign(!showAssign)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2.5 rounded-xl transition">
            <Link size={16} /> Assigner
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl transition">
            <Plus size={18} /> Nouveau carré
          </button>
        </div>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Nouveau carré VIP</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nom du carré *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Carré Gold, Carré VIP 1..." />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Minimum spending (€) *</label>
              <input type="number" value={form.min_spending} onChange={e => setForm(f => ({ ...f, min_spending: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="400" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Capacité (personnes)</label>
              <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="8" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Face à la scène, service dédié..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleCreate} disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition">
              {saving ? 'Création...' : 'Créer le carré'}
            </button>
          </div>
        </div>
      )}

      {/* Assigner à une soirée */}
      {showAssign && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Assigner des carrés à une soirée</h3>
          <div className="mb-4">
            <label className="text-sm text-zinc-400 mb-1 block">Choisir la soirée</label>
            <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition">
              <option value="">-- Sélectionner une soirée --</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name} — {formatDate(e.date)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Sélectionner les carrés</label>
            <div className="space-y-2">
              {tables.map(t => (
                <label key={t.id} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-zinc-700 transition">
                  <input type="checkbox" checked={selectedTableIds.includes(t.id)} onChange={() => toggleTable(t.id)}
                    className="accent-purple-600" />
                  <span className="text-white text-sm">{t.name}</span>
                  <span className="text-purple-400 text-sm ml-auto">{formatPrice(t.min_spending)} min</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowAssign(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleAssign} disabled={saving || !selectedEventId || selectedTableIds.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition">
              {saving ? 'Assignation...' : 'Assigner'}
            </button>
          </div>
        </div>
      )}

      {/* Liste carrés */}
      {loading ? (
        <div className="text-zinc-500 text-center py-12">Chargement...</div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Armchair size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Aucun carré VIP créé</p>
          <p className="text-zinc-600 text-sm mt-1">Créez vos carrés puis assignez-les à vos soirées</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={table.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-white font-semibold">{table.name}</p>
                <button onClick={() => handleDelete(table.id)}
                  className="text-zinc-600 hover:text-red-400 transition p-1">
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="text-purple-400 text-xl font-bold mb-1">{formatPrice(table.min_spending)}</p>
              <p className="text-zinc-500 text-xs mb-3">minimum spending</p>
              {table.capacity && <p className="text-zinc-400 text-sm">👥 {table.capacity} personnes max</p>}
              {table.description && <p className="text-zinc-500 text-sm mt-1">{table.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
