import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Admin-only routes
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/discover', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Public routes — always allowed
        const publicPaths = ['/discover', '/login', '/register', '/forgot-password', '/reset-password', '/live', '/rooms', '/videos', '/search', '/scheduled', '/subscribe/success', '/subscribe/cancel']
        if (publicPaths.some(p => pathname.startsWith(p))) return true
        if (pathname.startsWith('/api/auth')) return true
        if (pathname.startsWith('/api/search')) return true
        if (pathname.startsWith('/api/streams') && req.method === 'GET') return true
        if (pathname.startsWith('/api/users') && req.method === 'GET') return true
        if (pathname.startsWith('/api/audio-rooms') && req.method === 'GET') return true
        if (pathname.startsWith('/api/video-posts') && req.method === 'GET') return true
        if (pathname.startsWith('/api/scheduled-streams') && req.method === 'GET') return true
        if (pathname.startsWith('/api/gifts') && req.method === 'GET') return true
        if (pathname.startsWith('/api/creator/sub-tiers') && req.method === 'GET') return true
        if (pathname.startsWith('/api/webhooks')) return true
        if (pathname.match(/^\/[^/]+$/)) return true // creator profiles e.g. /username
        // Everything else requires a token
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
