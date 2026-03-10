import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", { apiVersion: "2026-02-25.clover" }) }

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminSupabase()

  const getPlanFromPriceId = (priceId: string): string => {
    if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter'
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
    if (priceId === process.env.STRIPE_MULTI_PRICE_ID) return 'multi'
    return 'starter'
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const restaurantId = session.metadata?.restaurant_id
        if (!restaurantId) break
        if (session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          const plan = getPlanFromPriceId(priceId)
          await supabase.from('restaurants').update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_plan: plan,
          }).eq('id', restaurantId)
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId)
        await supabase.from('restaurants').update({
          subscription_status: subscription.status,
          subscription_plan: plan,
        }).eq('stripe_subscription_id', subscription.id)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase.from('restaurants').update({
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          subscription_plan: null,
        }).eq('stripe_subscription_id', subscription.id)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        const subscriptionId = invoice.subscription as string
        if (subscriptionId) {
          await supabase.from('restaurants').update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
