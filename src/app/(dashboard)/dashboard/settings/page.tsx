'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Copy, Check, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: '', slug: '', description: '', address: '', city: '',
    dress_code: '', arrival_info: '',
    cancellation_hours: 24, deposit_type: 'percent', deposit_value: 30,
  })
  const [venueId, setVenueId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: venue } = await supabase.from('venues').select('*').eq('user_id', user.id).single()
    if (!venue) return
    setVenueId(venue.id)
    setForm({
      name: venue.name || '',
      slug: venue.slug || '',
      description: venue.description || '',
      address: venue.address || '',
      city: venue.city || '',
      dress_code: venue.dress_code || '',
      arrival_info: venue.arrival_info || '',
      cancellation_hours: venue.cancellation_hours || 24,
      deposit_type: venue.deposit_type || 'percent',
      deposit_value: venue.deposit_value || 30,
    })
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('venues').update(form).eq('id', venueId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const reservationLink = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${form.slug}`

  const copyLink = () => {
    navigator.clipboard.writeText(reservationLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="text-zinc-500 text-center py-12">Chargement...</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Paramètres</h2>
        <p className="text-zinc-400 mt-1">Configurez votre profil et vos règles de réservation</p>
      </div>

      {/* Lien client */}
      <div className="bg-purple-600/10 border border-purple-600/20 rounded-2xl p-5 mb-8">
        <p className="text-purple-300 font-semibold mb-1">🔗 Votre lien de réservation client</p>
        <p className="text-zinc-400 text-sm mb-3">Partagez ce lien en bio Instagram, sur vos stories, etc.</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white truncate">
            {reservationLink}
          </div>
          <button onClick={copyLink}
            className="shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
            {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier</>}
          </button>
          <a href={reservationLink} target="_blank" rel="noopener noreferrer"
            className="shrink-0 p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition">
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Infos établissement */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Informations</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nom de l'établissement</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Slug (URL)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Ville</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Paris" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Adresse</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="12 rue de la Paix" />
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition resize-none"
              placeholder="Décrivez votre établissement..." />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Dress code</label>
            <input value={form.dress_code} onChange={e => setForm(f => ({ ...f, dress_code: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
              placeholder="Tenue chic obligatoire..." />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Informations d'arrivée</label>
            <textarea value={form.arrival_info} onChange={e => setForm(f => ({ ...f, arrival_info: e.target.value }))}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition resize-none"
              placeholder="Présentez-vous à l'accueil VIP, entrée latérale..." />
          </div>
        </div>
      </div>

      {/* Règles réservation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Règles de réservation</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              Délai d'annulation (heures avant la soirée)
            </label>
            <input type="number" value={form.cancellation_hours}
              onChange={e => setForm(f => ({ ...f, cancellation_hours: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
              min={1} />
            <p className="text-zinc-600 text-xs mt-1">Le client pourra annuler jusqu'à {form.cancellation_hours}h avant la soirée</p>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Type d'acompte</label>
            <div className="grid grid-cols-2 gap-3">
              {[['percent', 'Pourcentage (%)'], ['fixed', 'Montant fixe (€)']].map(([val, label]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, deposit_type: val }))}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition ${form.deposit_type === val ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              {form.deposit_type === 'percent' ? 'Pourcentage de l\'acompte' : 'Montant fixe de l\'acompte (€)'}
            </label>
            <input type="number" value={form.deposit_value}
              onChange={e => setForm(f => ({ ...f, deposit_value: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
              min={1} max={form.deposit_type === 'percent' ? 100 : undefined} />
            <p className="text-zinc-600 text-xs mt-1">
              {form.deposit_type === 'percent'
                ? `Pour un minimum spending de 400€, l'acompte sera de ${Math.round(400 * form.deposit_value / 100)}€`
                : `L'acompte sera de ${form.deposit_value}€ quelle que soit le minimum spending`}
            </p>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition">
        {saved ? <><Check size={18} /> Sauvegardé !</> : saving ? 'Sauvegarde...' : <><Save size={18} /> Sauvegarder</>}
      </button>
    </div>
  )
}
