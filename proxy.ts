import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect /apply and /admin routes — redirect unauthenticated users to login
  if ((pathname.startsWith('/apply') || pathname.startsWith('/admin')) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For authenticated users on protected routes, fetch their role once
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/apply') || pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Admins trying to access /apply or auth pages → send to /admin
    if (isAdmin && (pathname.startsWith('/apply') || pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Non-admins trying to access /admin → send to /apply
    if (!isAdmin && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/apply', request.url))
    }

    // Non-admins on auth pages or landing → send to /apply
    if (!isAdmin && (pathname === '/login' || pathname === '/signup' || pathname === '/') && user) {
      return NextResponse.redirect(new URL('/apply', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
}
