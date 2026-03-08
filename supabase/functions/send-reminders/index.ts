import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

function reminderEmail({ clientName, eventName, eventDate, eventTime, tableName, venueName, venueAddress, venueCity, dressCode, arrivalInfo, guestCount }: {
  clientName: string, eventName: string, eventDate: string, eventTime: string,
  tableName: string, venueName: string, venueAddress?: string, venueCity?: string,
  dressCode?: string, arrivalInfo?: string, guestCount: number
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Rappel de réservation</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">NightBook</h1>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;margin-bottom:16px;">
      <div style="text-align:center;margin-bottom:24px;"><span style="font-size:40px;">🎉</span></div>
      <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 8px;text-align:center;">C'est ce soir !</h2>
      <p style="color:#a1a1aa;font-size:14px;text-align:center;margin:0 0 28px;">
        Bonjour ${clientName}, votre soirée VIP est ce soir. On vous attend !
      </p>
      <div style="border-top:1px solid #27272a;padding-top:20px;">
        ${[
          ['📅 Soirée', eventName],
          ['🕐 Heure', eventTime],
          ['🛋️ Carré', tableName],
          ['📍 Lieu', venueAddress ? `${venueAddress}${venueCity ? ', ' + venueCity : ''}` : venueName],
          ['👥 Personnes', `${guestCount} personne${guestCount > 1 ? 's' : ''}`],
        ].map(([label, value]) => `
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #27272a20;">
            <span style="color:#71717a;font-size:13px;">${label}</span>
            <span style="color:#ffffff;font-size:13px;font-weight:500;">${value}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ${arrivalInfo ? `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">📍 Infos arrivée</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${arrivalInfo}</p>
    </div>` : ''}
    ${dressCode ? `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">👔 Dress code</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${dressCode}</p>
    </div>` : ''}
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#3f3f46;font-size:12px;margin:0;">NightBook — Plateforme de réservation VIP</p>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  // Sécurité : vérifier le header Authorization
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // Chercher les réservations confirmées dont la soirée est dans les prochaines 24h
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*, event_tables(*, vip_tables(name), events(name, date, start_time)), venues(name, address, city, dress_code, arrival_info)')
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .is('deleted_at', null)

    if (error) throw error

    let sent = 0

    for (const reservation of reservations || []) {
      const eventDate = reservation.event_tables?.events?.date
      if (!eventDate) continue

      // Construire la date/heure complète de la soirée
      const startTime = reservation.event_tables?.events?.start_time || '23:00:00'
      const eventDateTime = new Date(`${eventDate}T${startTime}`)

      // Envoyer si la soirée est entre maintenant et dans 24h
      if (eventDateTime > now && eventDateTime <= in24h) {
        const formattedDate = new Date(eventDate).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
        const formattedTime = startTime.slice(0, 5)

        const html = reminderEmail({
          clientName: reservation.client_name,
          eventName: reservation.event_tables?.events?.name || '',
          eventDate: formattedDate,
          eventTime: formattedTime,
          tableName: reservation.event_tables?.vip_tables?.name || '',
          venueName: reservation.venues?.name || '',
          venueAddress: reservation.venues?.address,
          venueCity: reservation.venues?.city,
          dressCode: reservation.venues?.dress_code,
          arrivalInfo: reservation.venues?.arrival_info,
          guestCount: reservation.guest_count,
        })

        await resend.emails.send({
          from: 'NightBook <onboarding@resend.dev>',
          to: reservation.client_email,
          subject: `🎉 C'est ce soir — ${reservation.event_tables?.events?.name}`,
          html,
        })

        // Marquer comme envoyé
        await supabase
          .from('reservations')
          .update({ reminder_sent: true })
          .eq('id', reservation.id)

        sent++
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Reminder error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
