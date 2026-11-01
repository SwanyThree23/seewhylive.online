import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId, deletedAt: null },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      tier: true,
      walletCents: true,
      stripeConnectId: true,
      twitterHandle: true,
      instagramHandle: true,
      websiteUrl: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  })

  if (!user) return err('NOT_FOUND', 'User not found', 404)

  return ok(user)
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const allowed = ['displayName', 'bio', 'avatarUrl', 'twitterHandle', 'instagramHandle', 'websiteUrl'] as const
  type AllowedKey = typeof allowed[number]
  const data: Partial<Record<AllowedKey, string>> = {}

  for (const key of allowed) {
    const val = (body as Record<string, unknown>)[key]
    if (typeof val === 'string') {
      data[key] = val.trim().slice(0, key === 'bio' ? 500 : 255)
    }
  }

  const user = await prisma.user.update({
    where: { id: ctx.userId },
    data,
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
  })

  return ok(user)
}
