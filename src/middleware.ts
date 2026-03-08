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

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: adminRecord } = await supabase
      .from('admins').select('id').eq('email', user.email).single()
    return NextResponse.redirect(new URL(adminRecord ? '/admin' : '/dashboard', request.url))
  }

  if (user && pathname.startsWith('/admin')) {
    const { data: adminRecord } = await supabase
      .from('admins').select('id').eq('email', user.email).single()
    if (!adminRecord) return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && pathname.startsWith('/dashboard')) {
    const { data: venue } = await supabase
      .from('venues').select('status').eq('user_id', user.id).single()
    if (venue?.status === 'suspended') {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }
    if (venue?.status === 'paused') {
      return NextResponse.redirect(new URL('/paused', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
