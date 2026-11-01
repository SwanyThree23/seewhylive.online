import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireRole, ok, err } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx
  const denied = requireRole(ctx, 'ADMIN')
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 100)
  const search = searchParams.get('q') ?? undefined

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(search ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, username: true, displayName: true, email: true,
      role: true, tier: true, walletCents: true, createdAt: true,
      _count: { select: { followers: true, streams: true } },
    },
  })

  const hasMore = users.length > limit
  const items = hasMore ? users.slice(0, limit) : users
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return ok({ items, nextCursor })
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx
  const denied = requireRole(ctx, 'ADMIN')
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return err('INVALID', 'userId is required', 400)

  // Soft delete only — never hard delete
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'admin.user.soft_delete',
    targetId: userId,
    targetType: 'User',
    meta: { adminId: ctx.userId },
  })

  return ok({ deleted: true })
}
