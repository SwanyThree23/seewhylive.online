import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { redis, REDIS_KEYS } from '@/lib/redis'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { sendNewFollowerEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

type Params = { params: Promise<{ username: string }> }

export async function GET(
  req: NextRequest,
  { params }: Params,
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { username } = await params
  const target = await prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: { id: true },
  })
  if (!target) return err('NOT_FOUND', 'User not found', 404)

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: ctx.userId, followingId: target.id } },
    select: { followerId: true },
  })

  return ok({ following: !!follow })
}

export async function POST(
  req: NextRequest,
  { params }: Params,
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  const { username } = await params
  const target = await prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: { id: true },
  })
  if (!target) return err('NOT_FOUND', 'User not found', 404)
  if (target.id === ctx.userId) return err('INVALID', 'Cannot follow yourself', 400)

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: ctx.userId, followingId: target.id } },
    create: { followerId: ctx.userId, followingId: target.id },
    update: {},
  })

  await redis.del(REDIS_KEYS.creatorProfile(username))

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
    createNotification({
      userId: target.id,
      type: 'NEW_FOLLOWER' as const,
      title: 'New Follower',
      body: `@${follower.username} started following you`,
      data: { followerUsername: follower.username },
    })
  }

  return ok({ following: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: Params,
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { username } = await params
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })
  if (!target) return err('NOT_FOUND', 'User not found', 404)

  await prisma.follow.deleteMany({
    where: { followerId: ctx.userId, followingId: target.id },
  })

  await redis.del(REDIS_KEYS.creatorProfile(username))
  return ok({ following: false })
}
