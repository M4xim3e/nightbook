'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Check, Calendar, MapPin, Users } from 'lucide-react'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('reservation_id')
  const [reservation, setReservation] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!reservationId) return
    const load = async () => {
      const { data } = await supabase
        .from('reservations')
        .select('*, event_tables(*, vip_tables(name), events(name, date, start_time)), venues(name, address, city, dress_code, arrival_info)')
        .eq('id', reservationId)
        .single()
      setReservation(data)
    }
    load()
  }, [reservationId])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`

  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-md mx-auto">

        {/* Header succès */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-400" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Réservation confirmée !</h1>
          <p className="text-zinc-400">Votre acompte a bien été encaissé. À très bientôt !</p>
        </div>

        {reservation && (
          <>
            {/* Récap réservation */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
              <h2 className="text-white font-semibold mb-4">Détails de votre réservation</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-purple-400 shrink-0" />
                  <div>
                    <p className="text-white">{reservation.event_tables?.events?.name}</p>
                    <p className="text-zinc-500">
                      {reservation.event_tables?.events?.date && formatDate(reservation.event_tables.events.date)}
                      {reservation.event_tables?.events?.start_time && ` à ${reservation.event_tables.events.start_time.slice(0, 5)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Users size={16} className="text-purple-400 shrink-0" />
                  <div>
                    <p className="text-white">{reservation.event_tables?.vip_tables?.name}</p>
                    <p className="text-zinc-500">{reservation.guest_count} personnes</p>
                  </div>
                </div>

                {(reservation.venues?.address || reservation.venues?.city) && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-purple-400 shrink-0" />
                    <p className="text-white">
                      {reservation.venues?.address}{reservation.venues?.city ? `, ${reservation.venues.city}` : ''}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800 mt-4 pt-4 flex justify-between">
                <span className="text-zinc-400 text-sm">Acompte payé</span>
                <span className="text-green-400 font-bold">{formatPrice(reservation.deposit_amount)}</span>
              </div>
            </div>

            {/* Infos arrivée */}
            {reservation.venues?.arrival_info && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">📍 Infos arrivée</p>
                <p className="text-zinc-300 text-sm">{reservation.venues.arrival_info}</p>
              </div>
            )}

            {/* Dress code */}
            {reservation.venues?.dress_code && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">👔 Dress code</p>
                <p className="text-zinc-300 text-sm">{reservation.venues.dress_code}</p>
              </div>
            )}

            {/* Demande spéciale */}
            {reservation.special_request && (
              <div className="bg-purple-600/10 border border-purple-600/20 rounded-2xl p-5 mb-4">
                <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">✨ Votre demande spéciale</p>
                <p className="text-zinc-300 text-sm">{reservation.special_request}</p>
              </div>
            )}
          </>
        )}

        <p className="text-center text-zinc-600 text-sm mt-6">
          Un email de confirmation a été envoyé à votre adresse
        </p>
      </div>
    </div>
  )
}
