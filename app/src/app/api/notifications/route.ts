import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
  const unreadOnly = searchParams.get('unread') === '1'

  const notifications = await prisma.notification.findMany({
    where: {
      userId: ctx.userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, type: true, title: true, body: true,
      data: true, isRead: true, createdAt: true,
    },
  })

  const hasMore = notifications.length > limit
  const items = hasMore ? notifications.slice(0, limit) : notifications
  const nextCursor = hasMore ? items[items.length - 1].id : null
  const unreadCount = await prisma.notification.count({
    where: { userId: ctx.userId, isRead: false },
  })

  return ok({ items, nextCursor, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const ids = (body as { ids?: unknown }).ids
  const markAll = (body as { markAll?: unknown }).markAll === true

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: ctx.userId, isRead: false },
      data: { isRead: true },
    })
    return ok({ updated: true })
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return err('INVALID', 'ids array is required', 400)
  }

  await prisma.notification.updateMany({
    where: { userId: ctx.userId, id: { in: ids as string[] } },
    data: { isRead: true },
  })

  return ok({ updated: true })
}
