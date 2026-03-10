import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import twilio from 'twilio'
import { differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'

function getResend() { return new Resend(process.env.RESEND_API_KEY || 're_placeholder') }

// Use untyped admin client for cron to avoid inference issues
function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  // Security check
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabase()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  try {
    // Get all active restaurants with expiry alerts enabled
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name, email, phone, alert_email_enabled, alert_sms_enabled, alert_days_before, alert_hour, subscription_status')
      .in('subscription_status', ['active', 'trialing'])
      .eq('alert_email_enabled', true)

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ message: 'No active restaurants', processed: 0 })
    }

    let totalAlertsSent = 0

    for (const restaurant of restaurants) {
      const daysBeforeExpiry = (restaurant.alert_days_before as number) || 2

      // Get stock entries expiring soon or already expired
      const futureDate = new Date(today.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const { data: expiringEntries } = await supabase
        .from('stock_entries')
        .select('id, product_name, quantity, unit, expiry_date')
        .eq('restaurant_id', restaurant.id)
        .eq('is_consumed', false)
        .lte('expiry_date', futureDateStr)

      if (!expiringEntries || expiringEntries.length === 0) continue

      // Filter entries that haven't received an alert today
      const { data: todayAlerts } = await supabase
        .from('alerts')
        .select('stock_entry_id')
        .eq('restaurant_id', restaurant.id)
        .gte('sent_at', `${todayStr}T00:00:00`)

      const alreadyAlerted = new Set((todayAlerts || []).map((a: any) => a.stock_entry_id))
      const newEntries = expiringEntries.filter((e: any) => !alreadyAlerted.has(e.id))

      if (newEntries.length === 0) continue

      const expiredEntries = newEntries.filter((e: any) => e.expiry_date < todayStr)
      const expiringSoonEntries = newEntries.filter((e: any) => e.expiry_date >= todayStr)

      // Build email
      const expiringList = expiringSoonEntries
        .map((e: any) => {
          const days = differenceInDays(parseISO(e.expiry_date), today)
          return `• ${e.product_name} (${e.quantity} ${e.unit}) — expire dans ${days}j (${format(parseISO(e.expiry_date), 'dd/MM/yyyy', { locale: fr })})`
        })
        .join('\n')

      const expiredList = expiredEntries
        .map((e: any) => `• ${e.product_name} (${e.quantity} ${e.unit}) — expiré depuis le ${format(parseISO(e.expiry_date), 'dd/MM/yyyy', { locale: fr })}`)
        .join('\n')

      const emailBody = `Bonjour,

Voici le rapport de péremption de votre restaurant "${restaurant.name}" :
${expiredList ? '\n🔴 PRODUITS EXPIRÉS :\n' + expiredList + '\n' : ''}${expiringList ? '\n🟡 PRODUITS EXPIRANT BIENTÔT :\n' + expiringList + '\n' : ''}
Connectez-vous à FreshTrack pour gérer votre stock :
${process.env.NEXT_PUBLIC_APP_URL}/stock

L'équipe FreshTrack`

      // Send email
      if (restaurant.alert_email_enabled && restaurant.email) {
        try {
          await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@freshtrack.fr',
            to: restaurant.email as string,
            subject: `⚠️ FreshTrack — ${newEntries.length} produit(s) nécessitent votre attention`,
            text: emailBody,
          })

          // Record email alerts
          const emailAlerts = newEntries.map((entry: any) => ({
            restaurant_id: restaurant.id,
            stock_entry_id: entry.id,
            alert_type: entry.expiry_date < todayStr ? 'expired' : 'expiring_soon',
            days_before_expiry: differenceInDays(parseISO(entry.expiry_date), today),
            channel: 'email',
          }))

          await supabase.from('alerts').insert(emailAlerts)
          totalAlertsSent += newEntries.length
        } catch (emailError) {
          console.error(`Email send failed for restaurant ${restaurant.id}:`, emailError)
        }
      }

      // Send SMS if enabled
      if (restaurant.alert_sms_enabled && restaurant.phone) {
        try {
          const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

          const smsBody = `FreshTrack — ${newEntries.length} produit(s) expirent bientôt dans "${restaurant.name}". Connectez-vous : ${process.env.NEXT_PUBLIC_APP_URL}/stock`

          await twilioClient.messages.create({
            body: smsBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: restaurant.phone as string,
          })

          // Record SMS alerts
          const smsAlerts = newEntries.map((entry: any) => ({
            restaurant_id: restaurant.id,
            stock_entry_id: entry.id,
            alert_type: entry.expiry_date < todayStr ? 'expired' : 'expiring_soon',
            days_before_expiry: differenceInDays(parseISO(entry.expiry_date), today),
            channel: 'sms',
          }))

          await supabase.from('alerts').insert(smsAlerts)
        } catch (smsError) {
          console.error(`SMS send failed for restaurant ${restaurant.id}:`, smsError)
        }
      }
    }

    return NextResponse.json({
      message: 'Expiry check completed',
      restaurants_checked: restaurants.length,
      alerts_sent: totalAlertsSent,
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
