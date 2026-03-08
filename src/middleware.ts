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

  // Redirection si non connecté
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirection si non connecté sur /admin
  if (!user && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirection si déjà connecté
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Vérification admin
  if (user && pathname.startsWith('/admin')) {
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!adminRecord) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Vérification is_active pour les boîtes
  if (user && pathname.startsWith('/dashboard')) {
    const { data: venue } = await supabase
      .from('venues')
      .select('is_active')
      .eq('user_id', user.id)
      .single()

    if (venue && venue.is_active === false) {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
