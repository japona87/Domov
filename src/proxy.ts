// src/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
  const { pathname } = request.nextUrl

  // Rutas públicas: landing y login
  if (pathname === '/' || pathname.startsWith('/propiedades') || pathname.startsWith('/login')) {
    // Si ya está autenticado y va al login, redirigir a su dashboard
    if (user && pathname.startsWith('/login')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const redirectTo = profile?.role === 'admin' ? '/admin/dashboard' : profile?.role === 'owner' ? '/owner/dashboard' : '/tenant/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return supabaseResponse
  }

  // Rutas protegidas: requieren autenticación
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Proteger rutas /admin — solo admins
  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    const fallback = profile?.role === 'tenant' ? '/tenant/dashboard' : '/owner/dashboard'
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  // Proteger rutas /tenant — solo tenants
  if (pathname.startsWith('/tenant') && profile?.role !== 'tenant') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Proteger rutas /owner — solo owners
  if (pathname.startsWith('/owner') && profile?.role !== 'owner') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/tenant/:path*', '/owner/:path*', '/login'],
}
