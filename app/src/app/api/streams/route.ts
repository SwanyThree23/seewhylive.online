import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { createStreamSchema } from '@/lib/validations/stream'
import { writeAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const genre = searchParams.get('genre') ?? undefined
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  const streams = await prisma.stream.findMany({
    where: {
      status: 'LIVE',
      ...(genre ? { genre: genre as never } : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { viewerCount: 'desc' },
    select: {
      id: true,
      title: true,
      genre: true,
      thumbnailUrl: true,
      viewerCount: true,
      isPaywalled: true,
      paywallAmountCents: true,
      watchTier: true,
      startedAt: true,
      creator: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, tier: true },
      },
    },
  })

  const hasMore = streams.length > limit
  const items = hasMore ? streams.slice(0, limit) : streams
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return ok({ items, nextCursor })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = createStreamSchema.safeParse(body)
  if (!parsed.success) {
    const fields: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (!fields[key]) fields[key] = []
      fields[key].push(issue.message)
    }
    return err('VALIDATION_ERROR', 'Invalid input', 422, fields)
  }

  const {
    title, description, genre, panelCount, watchTier, isPaywalled,
    paywallAmountCents, scheduledAt, auraEnabled, auraPersonality,
  } = parsed.data

  const stream = await prisma.stream.create({
    data: {
      creatorId: ctx.userId,
      title,
      description,
      genre,
      panelCount,
      watchTier,
      isPaywalled,
      paywallAmountCents,
      auraEnabled,
      auraPersonality,
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
    },
    select: { id: true, title: true, genre: true, status: true, createdAt: true },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'stream.create',
    targetId: stream.id,
    targetType: 'Stream',
    meta: { title, genre },
  })

  return ok(stream, 201)
}
