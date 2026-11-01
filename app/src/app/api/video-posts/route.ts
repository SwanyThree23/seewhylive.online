import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'

const createVideoSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  videoUrl: z.string().url(),
  durationSeconds: z.number().int().positive().optional(),
  isPaywalled: z.boolean().default(false),
  paywallAmountCents: z.number().int().positive().max(50000).optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creatorId = searchParams.get('creatorId')
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '12', 10), 24)

  if (!creatorId) return err('INVALID', 'creatorId is required', 400)

  const posts = await prisma.videoPost.findMany({
    where: { creatorId, isPublished: true, deletedAt: null },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, description: true, thumbnailUrl: true,
      durationSeconds: true, views: true, isPaywalled: true, paywallAmountCents: true,
      publishedAt: true,
      creator: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  })

  const hasMore = posts.length > limit
  const items = hasMore ? posts.slice(0, limit) : posts
  return ok({ items, nextCursor: hasMore ? items[items.length - 1].id : null })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = createVideoSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const post = await prisma.videoPost.create({
    data: {
      creatorId: ctx.userId,
      ...parsed.data,
      isPublished: false,
    },
  })

  return ok({ post }, 201)
}
