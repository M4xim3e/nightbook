'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, Trash2, Eye, EyeOff } from 'lucide-react'

type Event = {
  id: string
  name: string
  date: string
  start_time: string
  theme: string
  description: string
  is_published: boolean
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [venueId, setVenueId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', start_time: '23:00', theme: '', description: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: venue } = await supabase.from('venues').select('id').eq('user_id', user.id).single()
    if (!venue) return
    setVenueId(venue.id)
    const { data } = await supabase.from('events').select('*').eq('venue_id', venue.id).order('date', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.name || !form.date) return
    setSaving(true)
    await supabase.from('events').insert({ ...form, venue_id: venueId, is_published: false })
    setForm({ name: '', date: '', start_time: '23:00', theme: '', description: '' })
    setShowForm(false)
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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Soirées</h2>
          <p className="text-zinc-400 mt-1">Gérez vos soirées et rendez-les visibles aux clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
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

      {/* Liste soirées */}
      {loading ? (
        <div className="text-zinc-500 text-center py-12">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Calendar size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Aucune soirée créée</p>
          <p className="text-zinc-600 text-sm mt-1">Créez votre première soirée pour commencer à recevoir des réservations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold truncate">{event.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${event.is_published ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {event.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <p className="text-purple-400 text-sm">{formatDate(event.date)} à {event.start_time?.slice(0, 5)}</p>
                {event.theme && <p className="text-zinc-500 text-sm mt-0.5">🎉 {event.theme}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish(event)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  title={event.is_published ? 'Dépublier' : 'Publier'}>
                  {event.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => handleDelete(event.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
