'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Wine, Trash2 } from 'lucide-react'

type Category = { id: string; name: string; sort_order: number }
type Drink = { id: string; name: string; price: number; category_id: string; is_available: boolean }

export default function DrinksPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [venueId, setVenueId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCatForm, setShowCatForm] = useState(false)
  const [showDrinkForm, setShowDrinkForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [drinkForm, setDrinkForm] = useState({ name: '', price: '', category_id: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: venue } = await supabase.from('venues').select('id').eq('user_id', user.id).single()
    if (!venue) return
    setVenueId(venue.id)
    const { data: cats } = await supabase.from('drink_categories').select('*').eq('venue_id', venue.id).order('sort_order')
    const { data: drinksData } = await supabase.from('drinks').select('*').eq('venue_id', venue.id)
    setCategories(cats || [])
    setDrinks(drinksData || [])
    setLoading(false)
  }

  const handleCreateCat = async () => {
    if (!catName) return
    setSaving(true)
    await supabase.from('drink_categories').insert({ venue_id: venueId, name: catName, sort_order: categories.length })
    setCatName('')
    setShowCatForm(false)
    await loadData()
    setSaving(false)
  }

  const handleCreateDrink = async () => {
    if (!drinkForm.name || !drinkForm.price || !drinkForm.category_id) return
    setSaving(true)
    await supabase.from('drinks').insert({
      venue_id: venueId,
      name: drinkForm.name,
      price: Math.round(parseFloat(drinkForm.price) * 100),
      category_id: drinkForm.category_id,
    })
    setDrinkForm({ name: '', price: '', category_id: '' })
    setShowDrinkForm(false)
    await loadData()
    setSaving(false)
  }

  const handleDeleteDrink = async (id: string) => {
    await supabase.from('drinks').delete().eq('id', id)
    await loadData()
  }

  const handleDeleteCat = async (id: string) => {
    if (!confirm('Supprimer cette catégorie et toutes ses boissons ?')) return
    await supabase.from('drinks').delete().eq('category_id', id)
    await supabase.from('drink_categories').delete().eq('id', id)
    await loadData()
  }

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Carte boissons</h2>
          <p className="text-zinc-400 mt-1">Gérez vos catégories et boissons disponibles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCatForm(!showCatForm); setShowDrinkForm(false) }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
            <Plus size={16} /> Catégorie
          </button>
          <button onClick={() => { setShowDrinkForm(!showDrinkForm); setShowCatForm(false) }}
            disabled={categories.length === 0}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">
            <Plus size={16} /> Boisson
          </button>
        </div>
      </div>

      {/* Formulaire catégorie */}
      {showCatForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-3">Nouvelle catégorie</h3>
          <div className="flex gap-3">
            <input value={catName} onChange={e => setCatName(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
              placeholder="Ex: Champagne, Spirits, Softs..." />
            <button onClick={() => setShowCatForm(false)} className="px-4 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleCreateCat} disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition text-sm">
              Créer
            </button>
          </div>
        </div>
      )}

      {/* Formulaire boisson */}
      {showDrinkForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-3">Nouvelle boisson</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Catégorie *</label>
              <select value={drinkForm.category_id} onChange={e => setDrinkForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition">
                <option value="">-- Catégorie --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nom *</label>
              <input value={drinkForm.name} onChange={e => setDrinkForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="Moët & Chandon" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Prix (€) *</label>
              <input type="number" value={drinkForm.price} onChange={e => setDrinkForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                placeholder="150" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowDrinkForm(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm transition">Annuler</button>
            <button onClick={handleCreateDrink} disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition">
              {saving ? 'Ajout...' : 'Ajouter la boisson'}
            </button>
          </div>
        </div>
      )}

      {/* Liste par catégorie */}
      {loading ? (
        <div className="text-zinc-500 text-center py-12">Chargement...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Wine size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Aucune boisson configurée</p>
          <p className="text-zinc-600 text-sm mt-1">Commencez par créer une catégorie (Champagne, Spirits...)</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{cat.name}</h3>
                <button onClick={() => handleDeleteCat(cat.id)} className="text-zinc-600 hover:text-red-400 transition">
                  <Trash2 size={15} />
                </button>
              </div>
              {drinks.filter(d => d.category_id === cat.id).length === 0 ? (
                <p className="text-zinc-600 text-sm italic">Aucune boisson dans cette catégorie</p>
              ) : (
                <div className="space-y-2">
                  {drinks.filter(d => d.category_id === cat.id).map(drink => (
                    <div key={drink.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                      <span className="text-white text-sm">{drink.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-400 font-semibold text-sm">{formatPrice(drink.price)}</span>
                        <button onClick={() => handleDeleteDrink(drink.id)} className="text-zinc-600 hover:text-red-400 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
