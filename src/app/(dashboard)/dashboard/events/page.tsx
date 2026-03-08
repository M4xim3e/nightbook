'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, Trash2, Eye, EyeOff, Copy, Pencil } from 'lucide-react'

type VipTable = {
  id: string
  name: string
  min_spending: number
  auto_assign: boolean
}

type EventTable = {
  id: string
  event_id: string
  vip_table_id: string
  is_available: boolean
  custom_min_spending: number | null
  vip_tables: { name: string; min_spending: number } | null
  reservationCount: number
}

type Event = {
  id: string
  name: string
  date: string
  start_time: string
  theme: string
  description: string
  is_published: boolean
  event_tables: EventTable[]
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [allTables, setAllTables] = useState<VipTable[]>([])
  const [venueId, setVenueId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', start_time: '23:00', theme: '', description: '' })
  const [selectedAutoTables, setSelectedAutoTables] = useState<string[]>([])
  const [selectedExclusiveTables, setSelectedExclusiveTables] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [duplicateEventId, setDuplicateEventId] = useState<string | null>(null)
  const [duplicateDate, setDuplicateDate] = useState('')
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editForm, setEditForm] = useState({ name: '', date: '', start_time: '23:00', theme: '', description: '' })
  const [editSelectedTables, setEditSelectedTables] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: venue } = await supabase.from('venues').select('id').eq('user_id', user.id).single()
    if (!venue) return
    setVenueId(venue.id)

    const { data: tables } = await supabase.from('vip_tables').select('*').eq('venue_id', venue.id).order('min_spending')
    const tableList = tables || []
    setAllTables(tableList)
    setSelectedAutoTables(tableList.filter(t => t.auto_assign).map(t => t.id))

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('venue_id', venue.id)
      .order('date', { ascending: false })

    if (!eventsData || eventsData.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }

    const eventIds = eventsData.map(e => e.id)

    const { data: etData } = await supabase
      .from('event_tables')
      .select('id, event_id, vip_table_id, is_available, custom_min_spending, vip_tables(name, min_spending)')
      .in('event_id', eventIds)

    const etList = etData || []
    const etIds = etList.map(et => et.id)

    let resCounts: Record<string, number> = {}
    if (etIds.length > 0) {
      const { data: resData } = await supabase
        .from('reservations')
        .select('event_table_id')
        .in('event_table_id', etIds)
        .in('status', ['confirmed', 'pending'])
        .is('deleted_at', null)
      if (resData) {
        resData.forEach(r => {
          resCounts[r.event_table_id] = (resCounts[r.event_table_id] || 0) + 1
        })
      }
    }

    const eventsWithTables: Event[] = eventsData.map(event => ({
      ...event,
      event_tables: etList
        .filter(et => et.event_id === event.id)
        .map(et => ({
          ...et,
          vip_tables: et.vip_tables as { name: string; min_spending: number } | null,
          reservationCount: resCounts[et.id] || 0,
        })),
    }))

    setEvents(eventsWithTables)
    setLoading(false)
  }

  const autoTables = allTables.filter(t => t.auto_assign)
  const exclusiveTables = allTables.filter(t => !t.auto_assign)

  const handleCreate = async () => {
    if (!form.name || !form.date) return
    setSaving(true)
    const { data: newEvent } = await supabase.from('events').insert({
      ...form, venue_id: venueId, is_published: false
    }).select().single()

    if (newEvent) {
      const autoInserts = selectedAutoTables.map(id => ({ event_id: newEvent.id, vip_table_id: id, is_available: true }))
      const exclusiveInserts = selectedExclusiveTables.map(tid => ({ event_id: newEvent.id, vip_table_id: tid, is_available: true }))
      const allInserts = [...autoInserts, ...exclusiveInserts]
      if (allInserts.length > 0) await supabase.from('event_tables').insert(allInserts)
    }

    setForm({ name: '', date: '', start_time: '23:00', theme: '', description: '' })
    setSelectedAutoTables(autoTables.map(t => t.id))
    setSelectedExclusiveTables([])
    setShowForm(false)
    await loadData()
    setSaving(false)
  }

  const handleDuplicate = async () => {
    if (!duplicateEventId || !duplicateDate) return
    setSaving(true)
    const original = events.find(e => e.id === duplicateEventId)
    if (!original) return

    const { data: newEvent } = await supabase.from('events').insert({
      venue_id: venueId, name: original.name, date: duplicateDate,
      start_time: original.start_time, theme: original.theme,
      description: original.description, is_published: false,
    }).select().single()

    if (newEvent) {
      const { data: originalTables } = await supabase.from('event_tables').select('*').eq('event_id', duplicateEventId)
      if (originalTables && originalTables.length > 0) {
        await supabase.from('event_tables').insert(
          originalTables.map(t => ({ event_id: newEvent.id, vip_table_id: t.vip_table_id, custom_min_spending: t.custom_min_spending, is_available: true }))
        )
      }
    }

    setDuplicateEventId(null)
    setDuplicateDate('')
    await loadData()
    setSaving(false)
  }

  const startEdit = (event: Event) => {
    setEditingEvent(event)
    setEditForm({
      name: event.name,
      date: event.date,
      start_time: event.start_time?.slice(0, 5) || '23:00',
      theme: event.theme || '',
      description: event.description || '',
    })
    setEditSelectedTables(event.event_tables.map(et => et.vip_table_id))
    setShowForm(false)
    setDuplicateEventId(null)
  }

  const handleEdit = async () => {
    if (!editingEvent || !editForm.name || !editForm.date) return
    setSaving(true)

    await supabase.from('events').update(editForm).eq('id', editingEvent.id)

    const currentTableIds = editingEvent.event_tables.map(et => et.vip_table_id)

    // Ajouter les nouveaux carrés sélectionnés
    const toAdd = editSelectedTables.filter(id => !currentTableIds.includes(id))
    if (toAdd.length > 0) {
      await supabase.from('event_tables').insert(
        toAdd.map(tid => ({ event_id: editingEvent.id, vip_table_id: tid, is_available: true }))
      )
    }

    // Supprimer les carrés désélectionnés uniquement s'ils n'ont aucune réservation active
    const toRemove = editingEvent.event_tables.filter(et => !editSelectedTables.includes(et.vip_table_id))
    for (const et of toRemove) {
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('event_table_id', et.id)
        .not('status', 'eq', 'cancelled')
        .is('deleted_at', null)
      if ((count || 0) === 0) {
        await supabase.from('event_tables').delete().eq('id', et.id)
      }
    }

    setEditingEvent(null)
    await loadData()
    setSaving(false)
  }

  const togglePublish = async (event: Event) => {
    await supabase.from('events').update({ is_published: !event.is_published }).eq('id', event.id)
    await loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette soirée ?')) return
    await supabase.from('events').delete().eq('id', id)
    await loadData()
  }

  const formatDateHeader = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`

  // Grouper par date
  const groupedEvents = events.reduce<Record<string, Event[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = []
    acc[event.date].push(event)
    return acc
  }, {})
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a))

  const closeAll = () => { setShowForm(false); setDuplicateEventId(null); setEditingEvent(null) }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Soirées</h2>
          <p className="text-zinc-400 mt-1">Gérez vos soirées et rendez-les visibles aux clients</p>
        </div>
        <button onClick={() => { closeAll(); setShowForm(s => !s) }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl transition">
          <Plus size={18} /> Nouvelle soirée
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Nouvelle soirée</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nom de la soirée *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Soirée Black & Gold" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Heure d'ouverture</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Thème</label>
              <input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Ex: Années 90, Halloween..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-zinc-400 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition resize-none"
                placeholder="Décrivez la soirée pour vos clients..." />
            </div>

            {/* Carrés auto — cochés par défaut, décochables */}
            {autoTables.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-zinc-400 mb-2">
                  Carrés automatiques <span className="text-zinc-600">(décochables pour cette soirée uniquement)</span>
                </p>
                <div className="space-y-2">
                  {autoTables.map(t => (
                    <label key={t.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${selectedAutoTables.includes(t.id) ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-800 border-zinc-700 opacity-60'}`}>
                      <input type="checkbox"
                        checked={selectedAutoTables.includes(t.id)}
                        onChange={() => setSelectedAutoTables(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                        className="accent-purple-600 w-4 h-4" />
                      <span className="text-white text-sm">{t.name}</span>
                      <span className="text-purple-400 text-sm ml-auto">{formatPrice(t.min_spending)} min</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Carrés exclusifs */}
            {exclusiveTables.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-zinc-400 mb-2">Carrés exclusifs à ajouter</p>
                <div className="space-y-2">
                  {exclusiveTables.map(t => (
                    <label key={t.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${selectedExclusiveTables.includes(t.id) ? 'bg-zinc-700 border-zinc-600' : 'bg-zinc-800 border-zinc-700'} hover:border-purple-500`}>
                      <input type="checkbox"
                        checked={selectedExclusiveTables.includes(t.id)}
                        onChange={() => setSelectedExclusiveTables(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                        className="accent-purple-600 w-4 h-4" />
                      <span className="text-white text-sm">{t.name}</span>
                      <span className="text-purple-400 text-sm ml-auto">{formatPrice(t.min_spending)} min</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleCreate} disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition">
              {saving ? 'Création...' : 'Créer la soirée'}
            </button>
          </div>
        </div>
      )}

      {/* Formulaire édition */}
      {editingEvent && (
        <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Modifier — {editingEvent.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nom *</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Date *</label>
              <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Heure d'ouverture</label>
              <input type="time" value={editForm.start_time} onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Thème</label>
              <input value={editForm.theme} onChange={e => setEditForm(f => ({ ...f, theme: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Ex: Années 90, Halloween..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-zinc-400 mb-1 block">Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition resize-none" />
            </div>
            {allTables.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-zinc-400 mb-2">Carrés assignés à cette soirée</p>
                <div className="space-y-2">
                  {allTables.map(t => (
                    <label key={t.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${editSelectedTables.includes(t.id) ? 'bg-zinc-700 border-zinc-600' : 'bg-zinc-800 border-zinc-700'} hover:border-purple-500`}>
                      <input type="checkbox"
                        checked={editSelectedTables.includes(t.id)}
                        onChange={() => setEditSelectedTables(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                        className="accent-purple-600 w-4 h-4" />
                      <span className="text-white text-sm">{t.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${t.auto_assign ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                        {t.auto_assign ? 'Auto' : 'Exclusif'}
                      </span>
                      <span className="text-purple-400 text-sm ml-auto">{formatPrice(t.min_spending)} min</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setEditingEvent(null)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleEdit} disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {/* Formulaire duplication */}
      {duplicateEventId && (
        <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-1">Dupliquer — {events.find(e => e.id === duplicateEventId)?.name}</h3>
          <p className="text-zinc-500 text-sm mb-4">Tous les paramètres et carrés assignés seront copiés.</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-zinc-400 mb-1 block">Nouvelle date *</label>
              <input type="date" value={duplicateDate} onChange={e => setDuplicateDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <button onClick={() => { setDuplicateEventId(null); setDuplicateDate('') }}
              className="px-4 py-3 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleDuplicate} disabled={saving || !duplicateDate}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition">
              {saving ? 'Duplication...' : 'Dupliquer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste soirées groupées par date */}
      {loading ? (
        <div className="text-zinc-500 text-center py-12">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Calendar size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Aucune soirée créée</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wide capitalize">
                  {formatDateHeader(date)}
                </p>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="space-y-3">
                {groupedEvents[date].map(event => (
                  <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold truncate">{event.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${event.is_published ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                            {event.is_published ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        <p className="text-purple-400 text-sm">à {event.start_time?.slice(0, 5)}</p>
                        {event.theme && <p className="text-zinc-500 text-sm mt-0.5">🎉 {event.theme}</p>}

                        {/* Carrés avec compteurs de réservations */}
                        {event.event_tables.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {event.event_tables.map(et => (
                              <div key={et.id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${!et.is_available ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                                <span>{et.vip_tables?.name}</span>
                                {et.reservationCount > 0 && (
                                  <span className={`font-semibold ${!et.is_available ? 'text-red-400' : 'text-purple-400'}`}>
                                    · {et.reservationCount} rés.
                                  </span>
                                )}
                                {!et.is_available && <span>· complet</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { startEdit(event) }}
                          className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition" title="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { closeAll(); setDuplicateEventId(event.id) }}
                          className="p-2 rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition" title="Dupliquer">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => togglePublish(event)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                          {event.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => handleDelete(event.id)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition">
                          <Trash2 size={16} />
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
  )
}
