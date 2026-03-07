import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { confirmationEmail } from '@/lib/emails/templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json()
    const supabase = await createClient()

    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, event_tables(*, vip_tables(name), events(name, date, start_time)), venues(name, slug, address, city, dress_code, arrival_info)')
      .eq('id', reservationId)
      .single()

    if (!reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    const eventDate = reservation.event_tables?.events?.date
      ? new Date(reservation.event_tables.events.date).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
      : ''

    const eventTime = reservation.event_tables?.events?.start_time?.slice(0, 5) || '23:00'

    const html = confirmationEmail({
      clientName: reservation.client_name,
      eventName: reservation.event_tables?.events?.name || '',
      eventDate,
      eventTime,
      tableName: reservation.event_tables?.vip_tables?.name || '',
      venueName: reservation.venues?.name || '',
      venueAddress: reservation.venues?.address,
      venueCity: reservation.venues?.city,
      dressCode: reservation.venues?.dress_code,
      arrivalInfo: reservation.venues?.arrival_info,
      guestCount: reservation.guest_count,
      depositAmount: reservation.deposit_amount,
      specialRequest: reservation.special_request,
    })

    await resend.emails.send({
      from: 'NightBook <onboarding@resend.dev>',
      to: reservation.client_email,
      subject: `✅ Réservation confirmée — ${reservation.event_tables?.events?.name} chez ${reservation.venues?.name}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
