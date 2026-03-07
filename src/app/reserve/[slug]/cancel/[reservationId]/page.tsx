'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { AlertTriangle, X, Check, Clock } from 'lucide-react'

export default function CancelPage() {
  const { reservationId } = useParams()
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')
  const [canCancel, setCanCancel] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('reservations')
        .select('*, event_tables(*, vip_tables(name), events(name, date, start_time)), venues(name)')
        .eq('id', reservationId)
        .single()

      if (data) {
        setReservation(data)
        if (data.cancellation_deadline) {
          setCanCancel(new Date() < new Date(data.cancellation_deadline))
        } else {
          setCanCancel(true)
        }
      }
      setLoading(false)
    }
    load()
  }, [reservationId])

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre réservation ?')) return
    setCancelling(true)
    setError('')

    const response = await fetch('/api/reservations/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId }),
    })

    const data = await response.json()

    if (data.error) {
      setError(data.error)
      setCancelling(false)
    } else {
      setCancelled(true)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`

  const formatDeadline = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-zinc-400">Chargement...</div>
    </div>
  )

  if (!reservation) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-zinc-400">Réservation introuvable</div>
    </div>
  )

  if (cancelled) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Réservation annulée</h2>
        <p className="text-zinc-400">
          Votre réservation a bien été annulée.
          {reservation.stripe_payment_status === 'succeeded' && (
            <span> Le remboursement de <strong className="text-white">{formatPrice(reservation.deposit_amount)}</strong> sera effectué sous 5 à 10 jours ouvrés.</span>
          )}
        </p>
      </div>
    </div>
  )

  if (reservation.status === 'cancelled') return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="text-zinc-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Déjà annulée</h2>
        <p className="text-zinc-400">Cette réservation a déjà été annulée.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-md mx-auto">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Annuler ma réservation</h1>
          <p className="text-zinc-400">chez {reservation.venues?.name}</p>
        </div>

        {/* Récap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Votre réservation</h2>
          <div className="space-y-3">
            {[
              ['Soirée', reservation.event_tables?.events?.name],
              ['Date', reservation.event_tables?.events?.date && formatDate(reservation.event_tables.events.date)],
              ['Carré', reservation.event_tables?.vip_tables?.name],
              ['Personnes', `${reservation.guest_count} pers.`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-zinc-500">{label}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
            {reservation.deposit_amount && (
              <div className="flex justify-between text-sm border-t border-zinc-800 pt-3 mt-3">
                <span className="text-zinc-400 font-medium">Acompte payé</span>
                <span className="text-purple-400 font-bold">{formatPrice(reservation.deposit_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Délai info */}
        {reservation.cancellation_deadline && (
          <div className={`rounded-2xl p-4 mb-6 flex items-start gap-3 ${canCancel ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <Clock size={18} className={canCancel ? 'text-green-400 shrink-0 mt-0.5' : 'text-red-400 shrink-0 mt-0.5'} />
            <div>
              <p className={`text-sm font-medium ${canCancel ? 'text-green-300' : 'text-red-300'}`}>
                {canCancel ? 'Annulation possible' : 'Délai dépassé'}
              </p>
              <p className={`text-xs mt-0.5 ${canCancel ? 'text-green-400/70' : 'text-red-400/70'}`}>
                Jusqu'au {formatDeadline(reservation.cancellation_deadline)}
              </p>
            </div>
          </div>
        )}

        {/* Remboursement info */}
        {canCancel && reservation.stripe_payment_status === 'succeeded' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300 text-sm">
              L'acompte de <strong>{formatPrice(reservation.deposit_amount)}</strong> vous sera remboursé automatiquement sous 5 à 10 jours ouvrés.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {canCancel ? (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition"
          >
            {cancelling ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
          </button>
        ) : (
          <div className="text-center py-4">
            <p className="text-zinc-500 text-sm">
              Le délai d'annulation est dépassé. Contactez directement l'établissement.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
