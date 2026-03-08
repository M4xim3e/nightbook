import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── RESERVATIONS ──────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const reservationId = session.metadata?.reservation_id

    if (reservationId) {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${reservationId}&bgcolor=18181b&color=ffffff&qzone=2`
      await supabase.from('reservations').update({
        status: 'confirmed',
        stripe_payment_status: 'succeeded',
        qr_code: qrCodeUrl,
      }).eq('id', reservationId)

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
    }

    // ── ABONNEMENT SOUSCRIT (fin du trial ou paiement immédiat)
    if (session.mode === 'subscription' && session.customer) {
      const customerId = session.customer as string
      await supabase.from('venues').update({
        status: 'active',
        subscription_id: session.subscription as string,
        subscription_status: 'active',
      }).eq('stripe_customer_id', customerId)
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const reservationId = session.metadata?.reservation_id
    if (reservationId) {
      await supabase.from('reservations')
        .update({ stripe_payment_status: 'expired' })
        .eq('id', reservationId)
    }
  }

  // ── ABONNEMENTS ───────────────────────────────────────────

  // Abonnement actif (trial démarré ou renouvelé)
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    const isActive = sub.status === 'active' || sub.status === 'trialing'

    await supabase.from('venues').update({
      subscription_id: sub.id,
      subscription_status: sub.status,
      status: isActive ? 'active' : 'paused',
    }).eq('stripe_customer_id', customerId)
  }

  // Paiement échoué → pause automatique
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    await supabase.from('venues').update({
      status: 'paused',
      subscription_status: 'past_due',
    }).eq('stripe_customer_id', customerId)
  }

  // Abonnement résilié → pause
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    await supabase.from('venues').update({
      status: 'paused',
      subscription_status: 'canceled',
    }).eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}
