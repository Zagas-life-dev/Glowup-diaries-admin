import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Add this to prevent infinite redirect loops
const MAX_AUTH_ATTEMPTS = 3
const AUTH_ATTEMPT_COOKIE = 'auth_attempt_count'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Check if we're accessing admin routes
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  // Check for potential auth loops
  let authAttempts = 0
  const attemptCookie = request.cookies.get(AUTH_ATTEMPT_COOKIE)
  if (attemptCookie) {
    authAttempts = parseInt(attemptCookie.value, 10)
  }

  // If we're in a potential loop, stop trying to authenticate
  if (authAttempts >= MAX_AUTH_ATTEMPTS) {
    const response = NextResponse.redirect(new URL('/admin/login?error=too_many_auth_attempts', request.url))
    // Reset the counter
    response.cookies.set(AUTH_ATTEMPT_COOKIE, '0', { 
      maxAge: 60, // 1 minute
      path: '/' 
    })
    return response
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    // If we get a rate limit error, redirect to a special error page
    if (error && error.status === 429) {
      return NextResponse.redirect(new URL('/admin/login?error=rate_limit', request.url))
    }

    if (error) throw error

    if (isAdminRoute && request.nextUrl.pathname !== '/admin/login' && request.nextUrl.pathname !== '/admin/signup') {
      // If no session and trying to access admin routes, redirect to login
      if (!session) {
        // Increment the auth attempt counter
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.set(AUTH_ATTEMPT_COOKIE, (authAttempts + 1).toString(), { 
          maxAge: 300, // 5 minutes
          path: '/' 
        })
        return response
      }

      // Check if user is an admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // If admin check fails due to rate limiting, handle it gracefully
      if (adminError && adminError.code === '429') {
        return NextResponse.redirect(new URL('/admin/login?error=rate_limit', request.url))
      }

      if (!adminUser) {
        // If not an admin, redirect to login
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    }

    // Reset the auth attempt counter on successful auth
    res.cookies.set(AUTH_ATTEMPT_COOKIE, '0', { 
      maxAge: 60, // 1 minute
      path: '/' 
    })
    
    return res
  } catch (error) {
    console.error('Auth error:', error)
    
    // Increment the attempt counter on error
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    response.cookies.set(AUTH_ATTEMPT_COOKIE, (authAttempts + 1).toString(), { 
      maxAge: 300, // 5 minutes
      path: '/' 
    })
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
