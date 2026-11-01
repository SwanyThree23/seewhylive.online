import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis, REDIS_KEYS, CACHE_TTL } from '@/lib/redis'
import type { UserRole } from '@prisma/client'

export interface AuthContext {
  userId: string
  role: UserRole
  tier: string
  username: string
}

// ── requireAuth ───────────────────────────────────────────────────────────────
// Extracts and verifies the JWT, fetches/caches the user, returns 401 if missing.
export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.userId) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 },
    )
  }

  const userId = token.userId as string

  // Try Redis cache first
  const cached = await redis.get(REDIS_KEYS.session(userId))
  if (cached) {
    try {
      return JSON.parse(cached) as AuthContext
    } catch {}
  }

  // Fall back to database
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, tier: true, username: true },
  })
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'User not found' } },
      { status: 401 },
    )
  }

  const ctx: AuthContext = {
    userId: user.id,
    role: user.role,
    tier: user.tier,
    username: user.username,
  }

  await redis.setex(REDIS_KEYS.session(userId), CACHE_TTL.SESSION, JSON.stringify(ctx))
  return ctx
}

// ── requireRole ───────────────────────────────────────────────────────────────
export function requireRole(
  ctx: AuthContext,
  roles: UserRole | UserRole[],
): NextResponse | null {
  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(ctx.role)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 },
    )
  }
  return null
}

// ── rateLimit ─────────────────────────────────────────────────────────────────
const LIMITS = {
  unauth: { max: 100, window: 60 },
  auth: { max: 500, window: 60 },
  authEndpoints: { max: 10, window: 60 },
  paymentEndpoints: { max: 20, window: 60 },
}

type LimitType = keyof typeof LIMITS

export async function rateLimit(
  key: string,
  type: LimitType = 'unauth',
): Promise<NextResponse | null> {
  const { max, window } = LIMITS[type]
  const redisKey = REDIS_KEYS.rateLimit(`${type}:${key}`)

  const current = await redis.incr(redisKey)
  if (current === 1) await redis.expire(redisKey, window)

  if (current > max) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      {
        status: 429,
        headers: { 'Retry-After': String(window) },
      },
    )
  }
  return null
}

// ── API response helpers ──────────────────────────────────────────────────────
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

export function err(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string[]>,
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, ...(fields && { fields }) } }, { status })
}

// ── IP extraction ─────────────────────────────────────────────────────────────
export function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
