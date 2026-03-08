import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Vérifier que le demandeur est bien un admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: adminRecord } = await supabase
      .from('admins').select('id').eq('email', user.email).single()
    if (!adminRecord) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { venueId, status } = await request.json()
    if (!venueId || !['active', 'paused', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('venues')
      .update({ status })
      .eq('id', venueId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin set-status error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
