import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { supabaseResponse, supabase, user } =
    await updateSession(request)

  /* -------------------------------
     1. PUBLIC ROUTES
  -------------------------------- */

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/(auth)')

  if (isPublicRoute) {
    return supabaseResponse
  }

  /* -------------------------------
     2. AUTH REQUIRED
  -------------------------------- */

  if (!user) {
    const redirectUrl = new URL('/admin/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  /* -------------------------------
     3. ADMIN ROLE CHECK
  -------------------------------- */

  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (error || profile?.role !== 'admin') {
      return NextResponse.redirect(
        new URL('/unauthorized', request.url)
      )
    }
  }

  return supabaseResponse
}

/* -------------------------------
   MATCHER
-------------------------------- */

export const config = {
  matcher: ['/admin/:path*'],
}

