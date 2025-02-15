import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = ['/', '/login']

// Middleware function to protect routes
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow access to setup page for faculty
  if (pathname === '/faculty/setup') {
    return NextResponse.next()
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Admin check will be handled by the AuthProvider component
    return NextResponse.next()
  }

  // Protect faculty routes
  if (pathname.startsWith('/faculty')) {
    // Faculty check will be handled by the AuthProvider component
    return NextResponse.next()
  }

  // Default: allow access and let AuthProvider handle specific role checks
  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     * 4. public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 