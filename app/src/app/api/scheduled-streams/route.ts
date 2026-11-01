import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const createScheduledSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  panelCount: z.number().int().min(1).max(8).default(1),
  notifyFollowers: z.boolean().default(true),
  genre: z.enum([
    'TALK_SHOW', 'MUSIC', 'LIFESTYLE', 'COMMUNITY', 'PANEL',
    'COMEDY', 'SPORTS', 'GAMING', 'EDUCATION', 'OTHER',
  ]).default('OTHER'),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hostId = searchParams.get('hostId')
  const upcoming = searchParams.get('upcoming') !== '0'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  const where = {
    ...(hostId ? { hostId } : {}),
    ...(upcoming ? { scheduledAt: { gte: new Date() } } : {}),
  }

  const streams = await prisma.scheduledStream.findMany({
    where,
    take: limit,
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true, title: true, description: true, scheduledAt: true,
      panelCount: true, genre: true, notifyFollowers: true, createdAt: true,
      host: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  })

  return ok({ streams })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = createScheduledSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const scheduledAt = new Date(parsed.data.scheduledAt)
  if (scheduledAt <= new Date()) {
    return err('INVALID', 'scheduledAt must be in the future', 400)
  }

  const stream = await prisma.scheduledStream.create({
    data: {
      hostId: ctx.userId,
      ...parsed.data,
      scheduledAt,
    },
  })

  if (parsed.data.notifyFollowers) {
    const host = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { username: true, displayName: true },
    })
    prisma.follow.findMany({
      where: { followingId: ctx.userId },
      select: { followerId: true },
      take: 500,
    }).then(follows => {
      const displayName = host?.displayName ?? host?.username ?? 'Someone'
      return Promise.all(follows.map(f =>
        createNotification({
          userId: f.followerId,
          type: 'STREAM_STARTING',
          title: `${displayName} scheduled a stream`,
          body: `"${parsed.data.title}" — ${scheduledAt.toLocaleString()}`,
          data: { scheduledStreamId: stream.id, hostId: ctx.userId },
        })
      ))
    }).catch(() => { /* non-critical */ })
  }

  return ok({ stream }, 201)
}
