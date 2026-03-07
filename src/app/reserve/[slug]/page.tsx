'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Users, Wine, ChevronRight, ChevronLeft, Check } from 'lucide-react'

type Venue = {
  id: string
  name: string
  description: string
  dress_code: string
  arrival_info: string
  deposit_type: string
  deposit_value: number
  cancellation_hours: number
}

type Event = {
  id: string
  name: string
  date: string
  start_time: string
  theme: string
  description: string
}

type EventTable = {
  id: string
  is_available: boolean
  custom_min_spending: number | null
  vip_tables: {
    id: string
    name: string
    capacity: number
    min_spending: number
    description: string
  }
}

type DrinkCategory = {
  id: string
  name: string
  drinks: { id: string; name: string; price: number }[]
}

export default function ReservePage() {
  const { slug } = useParams()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [eventTables, setEventTables] = useState<EventTable[]>([])
  const [drinkCategories, setDrinkCategories] = useState<DrinkCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Sélections
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedTable, setSelectedTable] = useState<EventTable | null>(null)
  const [selectedDrinks, setSelectedDrinks] = useState<Record<string, number>>({})
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [specialRequest, setSpecialRequest] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: venueData } = await supabase
        .from('venues')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!venueData) { setLoading(false); return }
      setVenue(venueData)

      const today = new Date().toISOString().split('T')[0]
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('venue_id', venueData.id)
        .eq('is_published', true)
        .gte('date', today)
        .order('date', { ascending: true })

      setEvents(eventsData || [])

      const { data: cats } = await supabase
        .from('drink_categories')
        .select('*, drinks(*)')
        .eq('venue_id', venueData.id)
        .order('sort_order')

      setDrinkCategories(cats || [])
      setLoading(false)
    }
    load()
  }, [slug])

  const loadEventTables = async (eventId: string) => {
    const { data } = await supabase
      .from('event_tables')
      .select('*, vip_tables(*)')
      .eq('event_id', eventId)
      .eq('is_available', true)
    setEventTables(data || [])
  }

  const getMinSpending = (et: EventTable) =>
    et.custom_min_spending ?? et.vip_tables.min_spending

  const getDrinksTotal = () =>
    Object.entries(selectedDrinks).reduce((sum, [drinkId, qty]) => {
      const drink = drinkCategories
        .flatMap(c => c.drinks)
        .find(d => d.id === drinkId)
      return sum + (drink ? drink.price * qty : 0)
    }, 0)

  const getDepositAmount = () => {
    if (!venue || !selectedTable) return 0
    const minSpending = getMinSpending(selectedTable)
    if (venue.deposit_type === 'fixed') return venue.deposit_value * 100
    return Math.round(minSpending * venue.deposit_value / 100)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    if (!clientName || !clientEmail) {
      setError('Nom et email obligatoires')
      setSubmitting(false)
      return
    }

    const cancelDeadline = new Date(selectedEvent!.date)
    cancelDeadline.setHours(cancelDeadline.getHours() - (venue?.cancellation_hours || 24))

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        event_table_id: selectedTable!.id,
        venue_id: venue!.id,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        guest_count: guestCount,
        estimated_budget: getDrinksTotal() || null,
        special_request: specialRequest || null,
        status: 'pending',
        deposit_amount: getDepositAmount(),
        cancellation_deadline: cancelDeadline.toISOString(),
      })
      .select()
      .single()

    if (resError || !reservation) {
      setError('Erreur lors de la réservation, réessayez.')
      setSubmitting(false)
      return
    }

    if (Object.keys(selectedDrinks).length > 0) {
      const drinkInserts = Object.entries(selectedDrinks)
        .filter(([, qty]) => qty > 0)
        .map(([drinkId, qty]) => ({
          reservation_id: reservation.id,
          drink_id: drinkId,
          quantity: qty,
        }))
      await supabase.from('reservation_drinks').insert(drinkInserts)
    }

    setSuccess(true)
    setSubmitting(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-zinc-400">Chargement...</div>
    </div>
  )

  if (!venue) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-zinc-400">Établissement introuvable</div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Réservation envoyée !</h2>
        <p className="text-zinc-400">
          Vous recevrez un email de confirmation à <strong className="text-white">{clientEmail}</strong>.
        </p>
        <p className="text-zinc-500 text-sm mt-4">
          Un acompte de <strong className="text-white">{formatPrice(getDepositAmount())}</strong> sera demandé pour confirmer votre place.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">{venue.name}</h1>
          {venue.description && <p className="text-zinc-400 mt-2">{venue.description}</p>}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Soirée', 'Carré', 'Boissons', 'Infos'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-sm ${step === i + 1 ? 'text-white' : step > i + 1 ? 'text-purple-400' : 'text-zinc-600'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === i + 1 ? 'bg-purple-600 text-white' : step > i + 1 ? 'bg-purple-600/30 text-purple-400' : 'bg-zinc-800 text-zinc-600'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block">{label}</span>
              </div>
              {i < 3 && <div className={`w-8 h-px ${step > i + 1 ? 'bg-purple-600' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Choix soirée */}
        {step === 1 && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Choisissez une soirée</h2>
            {events.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">Aucune soirée disponible pour le moment</div>
            ) : (
              <div className="space-y-3">
                {events.map(event => (
                  <button
                    key={event.id}
                    onClick={() => { setSelectedEvent(event); loadEventTables(event.id); setStep(2) }}
                    className="w-full bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded-2xl p-5 text-left transition"
                  >
                    <p className="text-white font-semibold">{event.name}</p>
                    <p className="text-purple-400 text-sm mt-1">{formatDate(event.date)}</p>
                    {event.theme && <p className="text-zinc-500 text-sm mt-1">🎉 {event.theme}</p>}
                    {event.description && <p className="text-zinc-400 text-sm mt-2">{event.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Choix carré */}
        {step === 2 && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-1">Choisissez votre carré VIP</h2>
            <p className="text-zinc-500 text-sm mb-4">{selectedEvent && formatDate(selectedEvent.date)}</p>
            {eventTables.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">Aucun carré disponible pour cette soirée</div>
            ) : (
              <div className="space-y-3">
                {eventTables.map(et => (
                  <button
                    key={et.id}
                    onClick={() => { setSelectedTable(et); setStep(3) }}
                    className="w-full bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded-2xl p-5 text-left transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{et.vip_tables.name}</p>
                        {et.vip_tables.description && (
                          <p className="text-zinc-400 text-sm mt-1">{et.vip_tables.description}</p>
                        )}
                        {et.vip_tables.capacity && (
                          <p className="text-zinc-500 text-sm mt-2 flex items-center gap-1">
                            <Users size={14} /> Jusqu'à {et.vip_tables.capacity} personnes
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-purple-400 font-semibold">{formatPrice(getMinSpending(et))}</p>
                        <p className="text-zinc-500 text-xs">minimum</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(1)} className="mt-4 flex items-center gap-1 text-zinc-500 hover:text-white text-sm transition">
              <ChevronLeft size={16} /> Retour
            </button>
          </div>
        )}

        {/* STEP 3 — Boissons */}
        {step === 3 && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-1">Vos consommations prévues</h2>
            <p className="text-zinc-500 text-sm mb-4">Sélectionnez ce que vous pensez consommer (optionnel)</p>

            {drinkCategories.length === 0 ? (
              <div className="text-zinc-500 text-center py-6">Aucune boisson configurée</div>
            ) : (
              <div className="space-y-6">
                {drinkCategories.map(cat => (
                  <div key={cat.id}>
                    <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-3">{cat.name}</p>
                    <div className="space-y-2">
                      {cat.drinks?.map(drink => (
                        <div key={drink.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-white text-sm">{drink.name}</p>
                            <p className="text-purple-400 text-xs">{formatPrice(drink.price)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedDrinks(prev => ({ ...prev, [drink.id]: Math.max(0, (prev[drink.id] || 0) - 1) }))}
                              className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition"
                            >-</button>
                            <span className="text-white text-sm w-4 text-center">{selectedDrinks[drink.id] || 0}</span>
                            <button
                              onClick={() => setSelectedDrinks(prev => ({ ...prev, [drink.id]: (prev[drink.id] || 0) + 1 }))}
                              className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition"
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {getDrinksTotal() > 0 && (
              <div className="mt-4 bg-purple-600/10 border border-purple-600/20 rounded-xl px-4 py-3 flex justify-between">
                <span className="text-zinc-400 text-sm flex items-center gap-2"><Wine size={14} /> Total estimé</span>
                <span className="text-purple-400 font-semibold">{formatPrice(getDrinksTotal())}</span>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-zinc-500 hover:text-white text-sm transition">
                <ChevronLeft size={16} /> Retour
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                Continuer <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Infos client */}
        {step === 4 && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Vos informations</h2>

            {/* Récap */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Soirée</span>
                <span className="text-white">{selectedEvent?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Date</span>
                <span className="text-white">{selectedEvent && formatDate(selectedEvent.date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Carré</span>
                <span className="text-white">{selectedTable?.vip_tables.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Minimum spending</span>
                <span className="text-white">{selectedTable && formatPrice(getMinSpending(selectedTable))}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-zinc-800 pt-2 mt-2">
                <span className="text-zinc-400 font-medium">Acompte à payer</span>
                <span className="text-purple-400 font-bold">{formatPrice(getDepositAmount())}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Nom complet *</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                  placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Email *</label>
                <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                  placeholder="jean@email.com" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Téléphone</label>
                <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                  placeholder="+33 6 00 00 00 00" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Nombre de personnes</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="w-10 h-10 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition">-</button>
                  <span className="text-white font-semibold text-lg">{guestCount}</span>
                  <button onClick={() => setGuestCount(guestCount + 1)}
                    className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition">+</button>
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Demande spéciale (anniversaire, décoration...)</label>
                <textarea value={specialRequest} onChange={e => setSpecialRequest(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition resize-none"
                  placeholder="Ex: Anniversaire de Marie, prévoir une bougie sur le champagne..." />
              </div>
            </div>

            {venue.arrival_info && (
              <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Infos arrivée</p>
                <p className="text-zinc-300 text-sm">{venue.arrival_info}</p>
              </div>
            )}

            {venue.dress_code && (
              <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Dress code</p>
                <p className="text-zinc-300 text-sm">{venue.dress_code}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(3)} className="flex items-center gap-1 text-zinc-500 hover:text-white text-sm transition">
                <ChevronLeft size={16} /> Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                {submitting ? 'Envoi...' : `Réserver — Acompte ${formatPrice(getDepositAmount())}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
