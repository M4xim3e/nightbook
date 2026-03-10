import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", { apiVersion: "2026-02-25.clover" }) }

const schema = z.object({
  price_id: z.string(),
  restaurant_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { price_id, restaurant_id } = schema.parse(body)

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = restaurant.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: restaurant.email,
        name: restaurant.name,
        metadata: { restaurant_id: restaurant.id, user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('restaurants')
        .update({ stripe_customer_id: customerId })
        .eq('id', restaurant.id)
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
        metadata: { restaurant_id: restaurant.id },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      metadata: { restaurant_id: restaurant.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
