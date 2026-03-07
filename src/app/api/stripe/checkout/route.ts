import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json()

    const supabase = await createClient()

    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, event_tables(*, vip_tables(name), events(name, date)), venues(name, slug)')
      .eq('id', reservationId)
      .single()

    if (!reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    const eventName = reservation.event_tables?.events?.name || 'Soirée'
    const tableName = reservation.event_tables?.vip_tables?.name || 'Carré VIP'
    const venueName = reservation.venues?.name || 'Établissement'
    const eventDate = reservation.event_tables?.events?.date
      ? new Date(reservation.event_tables.events.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      locale: 'fr',
      customer_email: reservation.client_email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Acompte — ${tableName} chez ${venueName}`,
              description: `${eventName} • ${eventDate} • ${reservation.guest_count} personnes`,
            },
            unit_amount: reservation.deposit_amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        reservation_id: reservationId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${reservation.venues?.slug}/success?reservation_id=${reservationId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${reservation.venues?.slug}?cancelled=true`,
    })

    await supabase
      .from('reservations')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', reservationId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: 'Erreur Stripe' }, { status: 500 })
  }
}
