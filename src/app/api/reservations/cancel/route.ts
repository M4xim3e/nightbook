import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json()

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*, venues(name)')
      .eq('id', reservationId)
      .single()

    if (error || !reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Réservation déjà annulée' }, { status: 400 })
    }

    // Vérifier le délai d'annulation
    if (reservation.cancellation_deadline) {
      const deadline = new Date(reservation.cancellation_deadline)
      if (new Date() > deadline) {
        return NextResponse.json({
          error: 'Le délai d\'annulation est dépassé'
        }, { status: 400 })
      }
    }

    // Remboursement Stripe si paiement effectué
    if (
      reservation.stripe_payment_intent_id &&
      reservation.stripe_payment_status === 'succeeded'
    ) {
      try {
        // Récupérer la session Stripe pour obtenir le payment_intent
        const session = await stripe.checkout.sessions.retrieve(
          reservation.stripe_payment_intent_id
        )

        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
          })
        }
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError)
        return NextResponse.json({
          error: 'Erreur lors du remboursement Stripe'
        }, { status: 500 })
      }
    }

    // Mettre à jour le statut
    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)

    // Notifier la liste d'attente si applicable
    const { data: waitlist } = await supabase
      .from('waitlist')
      .select('*')
      .eq('event_table_id', reservation.event_table_id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (waitlist && waitlist.length > 0) {
      // On rend le carré disponible
      await supabase
        .from('event_tables')
        .update({ is_available: true })
        .eq('id', reservation.event_table_id)

      // Email waitlist (on le fera dans l'étape suivante)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
