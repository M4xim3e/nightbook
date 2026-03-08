import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!venue) return NextResponse.json({ error: 'Venue introuvable' }, { status: 404 })

  let customerId = venue.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: venue.name,
      metadata: { venue_id: venue.id, user_id: user.id }
    })
    customerId = customer.id
    await supabase.from('venues').update({ stripe_customer_id: customerId }).eq('id', venue.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.STRIPE_PRICE_ID!,
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: 14,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?cancelled=true`,
  })

  return NextResponse.json({ url: session.url })
}
