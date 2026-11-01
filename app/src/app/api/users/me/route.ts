import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { redis, REDIS_KEYS } from '@/lib/redis'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'

const updateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  twitterHandle: z.string().max(50).optional(),
  instagramHandle: z.string().max(50).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
})

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      id: true, email: true, username: true, displayName: true,
      avatarUrl: true, bio: true, tier: true, role: true,
      walletCents: true, stripeConnectId: true,
      twitterHandle: true, instagramHandle: true, websiteUrl: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  })

  if (!user) return err('NOT_FOUND', 'User not found', 404)
  return ok({ user: { ...user, hasStripe: !!user.stripeConnectId, stripeConnectId: undefined } })
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const data = parsed.data
  if (data.websiteUrl === '') data.websiteUrl = undefined

  const user = await prisma.user.update({
    where: { id: ctx.userId },
    data,
    select: {
      id: true, username: true, displayName: true, avatarUrl: true,
      bio: true, twitterHandle: true, instagramHandle: true, websiteUrl: true,
    },
  })

  return ok({ user })
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { deletedAt: new Date(), email: `deleted_${ctx.userId}@deleted.invalid` },
  })

  // Immediately revoke the Redis session cache so the user can't keep calling APIs
  await redis.del(REDIS_KEYS.session(ctx.userId))

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'user.self_delete',
    targetId: ctx.userId,
    targetType: 'User',
    ipAddress: getIP(req),
  })

  return ok({ deleted: true })
}
