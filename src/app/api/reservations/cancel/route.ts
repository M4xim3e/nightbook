import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { waitlistNotificationEmail } from '@/lib/emails/templates'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json()

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*, venues(name, slug), event_tables(*, vip_tables(name), events(name, date))')
      .eq('id', reservationId)
      .single()

    if (error || !reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Réservation déjà annulée' }, { status: 400 })
    }

    if (reservation.cancellation_deadline) {
      const deadline = new Date(reservation.cancellation_deadline)
      if (new Date() > deadline) {
        return NextResponse.json({ error: 'Le délai d\'annulation est dépassé' }, { status: 400 })
      }
    }

    // Remboursement Stripe
    if (reservation.stripe_payment_intent_id && reservation.stripe_payment_status === 'succeeded') {
      try {
        const session = await stripe.checkout.sessions.retrieve(reservation.stripe_payment_intent_id)
        if (session.payment_intent) {
          await stripe.refunds.create({ payment_intent: session.payment_intent as string })
        }
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError)
        return NextResponse.json({ error: 'Erreur lors du remboursement Stripe' }, { status: 500 })
      }
    }

    // Annuler la réservation
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', reservationId)

    // Remettre le carré disponible
    await supabase
      .from('event_tables')
      .update({ is_available: true })
      .eq('id', reservation.event_table_id)

    // Notifier le premier de la liste d'attente
    const { data: waitlist } = await supabase
      .from('waitlist')
      .select('*')
      .eq('event_table_id', reservation.event_table_id)
      .is('notified_at', null)
      .order('created_at', { ascending: true })
      .limit(1)

    if (waitlist && waitlist.length > 0) {
      const first = waitlist[0]

      const eventDate = reservation.event_tables?.events?.date
        ? new Date(reservation.event_tables.events.date).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })
        : ''

      const reservationLink = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${reservation.venues?.slug}`

      const html = waitlistNotificationEmail({
        clientName: first.client_name,
        eventName: reservation.event_tables?.events?.name || '',
        eventDate,
        tableName: reservation.event_tables?.vip_tables?.name || '',
        venueName: reservation.venues?.name || '',
        reservationLink,
      })

      await resend.emails.send({
        from: 'NightBook <onboarding@resend.dev>',
        to: first.client_email,
        subject: `🎉 Une place s'est libérée — ${reservation.event_tables?.events?.name}`,
        html,
      })

      // Marquer comme notifié
      await supabase
        .from('waitlist')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', first.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
