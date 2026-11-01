import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { redis, REDIS_KEYS } from '@/lib/redis'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { sendNewFollowerEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  const target = await prisma.user.findUnique({
    where: { username: params.username, deletedAt: null },
    select: { id: true },
  })
  if (!target) return err('NOT_FOUND', 'User not found', 404)
  if (target.id === ctx.userId) return err('INVALID', 'Cannot follow yourself', 400)

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: ctx.userId, followingId: target.id } },
    create: { followerId: ctx.userId, followingId: target.id },
    update: {},
  })

  await redis.del(REDIS_KEYS.creatorProfile(params.username))

  // Email notification + follower count (fire-and-forget)
  const [follower, creatorFull] = await Promise.all([
    prisma.user.findUnique({ where: { id: ctx.userId }, select: { username: true } }),
    prisma.user.findUnique({
      where: { id: target.id },
      select: { email: true, username: true, _count: { select: { followers: true } } },
    }),
  ])
  if (follower && creatorFull) {
    sendNewFollowerEmail(
      creatorFull.email,
      creatorFull.username,
      follower.username,
      creatorFull._count.followers,
    )
  }

  return ok({ following: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const target = await prisma.user.findUnique({
    where: { username: params.username },
    select: { id: true },
  })
  if (!target) return err('NOT_FOUND', 'User not found', 404)

  await prisma.follow.deleteMany({
    where: { followerId: ctx.userId, followingId: target.id },
  })

  await redis.del(REDIS_KEYS.creatorProfile(params.username))
  return ok({ following: false })
}
