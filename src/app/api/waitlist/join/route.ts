import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { eventTableId, clientName, clientEmail, clientPhone, guestCount } = await request.json()

    if (!eventTableId || !clientName || !clientEmail) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // Vérifier si déjà inscrit
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('event_table_id', eventTableId)
      .eq('client_email', clientEmail)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Vous êtes déjà sur la liste d\'attente pour ce carré' }, { status: 400 })
    }

    await supabase.from('waitlist').insert({
      event_table_id: eventTableId,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone || null,
      guest_count: guestCount || 2,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
