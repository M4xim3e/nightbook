'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Armchair, Trash2, Pencil } from 'lucide-react'

type VipTable = {
  id: string
  name: string
  capacity: number
  min_spending: number
  max_reservations: number | null
  description: string
  is_active: boolean
  auto_assign: boolean
}

const emptyForm = { name: '', capacity: '', min_spending: '', max_reservations: '', description: '', auto_assign: true }

export default function TablesPage() {
  const [tables, setTables] = useState<VipTable[]>([])
  const [venueId, setVenueId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingTable, setEditingTable] = useState<VipTable | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
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
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.name || !form.min_spending) return
    setSaving(true)

    const { data: newTable } = await supabase.from('vip_tables').insert({
      venue_id: venueId,
      name: form.name,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      min_spending: Math.round(parseFloat(form.min_spending) * 100),
      max_reservations: form.max_reservations ? parseInt(form.max_reservations) : null,
      description: form.description,
      auto_assign: form.auto_assign,
    }).select().single()

    if (newTable && form.auto_assign) {
      const { data: allEvents } = await supabase.from('events').select('id').eq('venue_id', venueId)
      if (allEvents && allEvents.length > 0) {
        await supabase.from('event_tables').insert(
          allEvents.map(e => ({ event_id: e.id, vip_table_id: newTable.id, is_available: true }))
        )
      }
    }

    setForm(emptyForm)
    setShowForm(false)
    await loadData()
    setSaving(false)
  }

  const startEdit = (table: VipTable) => {
    setEditingTable(table)
    setEditForm({
      name: table.name,
      capacity: table.capacity ? String(table.capacity) : '',
      min_spending: table.min_spending ? String(table.min_spending / 100) : '',
      max_reservations: table.max_reservations ? String(table.max_reservations) : '',
      description: table.description || '',
      auto_assign: table.auto_assign,
    })
    setShowForm(false)
  }

  const handleEdit = async () => {
    if (!editingTable || !editForm.name || !editForm.min_spending) return
    setSaving(true)

    await supabase.from('vip_tables').update({
      name: editForm.name,
      capacity: editForm.capacity ? parseInt(editForm.capacity) : null,
      min_spending: Math.round(parseFloat(editForm.min_spending) * 100),
      max_reservations: editForm.max_reservations ? parseInt(editForm.max_reservations) : null,
      description: editForm.description,
      auto_assign: editForm.auto_assign,
    }).eq('id', editingTable.id)

    // Si auto_assign activé → s'assurer qu'il est sur toutes les soirées
    if (editForm.auto_assign && !editingTable.auto_assign) {
      const { data: allEvents } = await supabase.from('events').select('id').eq('venue_id', venueId)
      if (allEvents && allEvents.length > 0) {
        const { data: existing } = await supabase.from('event_tables').select('event_id').eq('vip_table_id', editingTable.id)
        const existingIds = (existing || []).map(e => e.event_id)
        const toInsert = allEvents.filter(e => !existingIds.includes(e.id))
        if (toInsert.length > 0) {
          await supabase.from('event_tables').insert(toInsert.map(e => ({ event_id: e.id, vip_table_id: editingTable.id, is_available: true })))
        }
      }
    }

    setEditingTable(null)
    await loadData()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce carré ?')) return
    await supabase.from('vip_tables').delete().eq('id', id)
    await loadData()
  }

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`

  const FormFields = ({ f, setF }: { f: typeof emptyForm; setF: (fn: (prev: typeof emptyForm) => typeof emptyForm) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">Nom du carré *</label>
        <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
          placeholder="Carré Gold, Carré VIP 1..." />
      </div>
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">Minimum spending (€) *</label>
        <input type="number" value={f.min_spending} onChange={e => setF(p => ({ ...p, min_spending: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
          placeholder="400" />
      </div>
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">Capacité (personnes)</label>
        <input type="number" value={f.capacity} onChange={e => setF(p => ({ ...p, capacity: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
          placeholder="8" />
      </div>
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">
          Réservations max par soirée
          <span className="text-zinc-600 font-normal ml-1">(liste d'attente si dépassé)</span>
        </label>
        <input type="number" value={f.max_reservations} onChange={e => setF(p => ({ ...p, max_reservations: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
          placeholder="1" min="1" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm text-zinc-400 mb-1 block">Description</label>
        <input value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
          placeholder="Face à la scène, service dédié..." />
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-center gap-3 cursor-pointer bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 hover:border-purple-500 transition">
          <input
            type="checkbox"
            checked={f.auto_assign}
            onChange={e => setF(p => ({ ...p, auto_assign: e.target.checked }))}
            className="accent-purple-600 w-4 h-4"
          />
          <div>
            <p className="text-white text-sm font-medium">Visible sur toutes les soirées automatiquement</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {f.auto_assign
                ? 'Ce carré sera ajouté à toutes vos soirées existantes et futures'
                : 'Ce carré devra être sélectionné manuellement sur chaque soirée'}
            </p>
          </div>
        </label>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Carrés VIP</h2>
          <p className="text-zinc-400 mt-1">Les carrés automatiques apparaissent sur toutes vos soirées</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingTable(null) }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl transition">
          <Plus size={18} /> Nouveau carré
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Nouveau carré VIP</h3>
          <FormFields f={form} setF={setForm} />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleCreate} disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition">
              {saving ? 'Création...' : 'Créer le carré'}
            </button>
          </div>
        </div>
      )}

      {/* Formulaire édition */}
      {editingTable && (
        <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Modifier — {editingTable.name}</h3>
          <FormFields f={editForm} setF={setEditForm} />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setEditingTable(null)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleEdit} disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={table.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{table.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${table.auto_assign ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {table.auto_assign ? 'Toutes les soirées' : 'Exclusif'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(table)}
                    className="text-zinc-600 hover:text-blue-400 transition p-1" title="Modifier">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(table.id)}
                    className="text-zinc-600 hover:text-red-400 transition p-1">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="text-purple-400 text-xl font-bold mb-1">{formatPrice(table.min_spending)}</p>
              <p className="text-zinc-500 text-xs mb-3">minimum spending</p>
              {table.capacity && <p className="text-zinc-400 text-sm">👥 {table.capacity} personnes max</p>}
              {table.max_reservations && (
                <p className="text-zinc-400 text-sm mt-1">🔒 {table.max_reservations} réservation{table.max_reservations > 1 ? 's' : ''} max par soirée</p>
              )}
              {table.description && <p className="text-zinc-500 text-sm mt-1">{table.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
