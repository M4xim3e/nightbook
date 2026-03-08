import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Non connecté → login
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // Vérifier si admin à chaque fois
    const { data: adminRecord } = await supabase
      .from('admins').select('id').eq('email', user.email).single()

    const isAdmin = !!adminRecord

    // Admin qui essaie d'aller sur /dashboard → redirigé vers /admin
    if (isAdmin && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Admin ou boîte connectée sur /login ou /register → bonne redirection
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', request.url))
    }

    // Non-admin qui essaie d'aller sur /admin → redirigé vers /dashboard
    if (!isAdmin && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Boîte avec statut paused ou suspended
    if (!isAdmin && pathname.startsWith('/dashboard')) {
      const { data: venue } = await supabase
        .from('venues').select('status').eq('user_id', user.id).single()
      if (venue?.status === 'suspended') {
        return NextResponse.redirect(new URL('/suspended', request.url))
      }
      if (venue?.status === 'paused') {
        return NextResponse.redirect(new URL('/paused', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
