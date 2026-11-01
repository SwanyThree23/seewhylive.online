import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx
  if (ctx.role !== 'ADMIN') return err('FORBIDDEN', 'Admin only', 403)

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  const streams = await prisma.stream.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      viewerCount: true,
      genre: true,
      createdAt: true,
      startedAt: true,
      endedAt: true,
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  })

  const hasMore = streams.length > limit
  const items = hasMore ? streams.slice(0, limit) : streams
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return ok({ streams: items, nextCursor, hasMore })
}
