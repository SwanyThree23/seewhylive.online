import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(120),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const liveOnly = searchParams.get('live') !== '0'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  const rooms = await prisma.audioRoom.findMany({
    where: liveOnly ? { isLive: true } : {},
    take: limit,
    orderBy: { listenerCount: 'desc' },
    select: {
      id: true, title: true, isLive: true, listenerCount: true, createdAt: true,
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true, tier: true } },
    },
  })

  return ok({ rooms })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  // Enforce one active room per host
  const existing = await prisma.audioRoom.findFirst({
    where: { hostId: ctx.userId, isLive: true },
  })
  if (existing) return err('CONFLICT', 'You already have a live audio room', 409)

  const room = await prisma.audioRoom.create({
    data: {
      hostId: ctx.userId,
      title: parsed.data.title,
      isLive: true,
    },
  })

  return ok({ room }, 201)
}
