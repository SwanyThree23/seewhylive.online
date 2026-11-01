import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { searchParams } = new URL(req.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '30', 10), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [earnings, streams, followerCount, subCount] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        toUserId: ctx.userId,
        status: 'SUCCEEDED',
        createdAt: { gte: since },
        type: { in: ['TIP', 'PAYWALL_UNLOCK', 'SUBSCRIPTION'] },
      },
      _sum: { creatorAmountCents: true },
      _count: { id: true },
    }),
    prisma.stream.findMany({
      where: { creatorId: ctx.userId, createdAt: { gte: since } },
      select: { id: true, title: true, status: true, viewerCount: true, startedAt: true, endedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.follow.count({ where: { followingId: ctx.userId } }),
    prisma.subscription.count({ where: { creatorId: ctx.userId, status: 'ACTIVE' } }),
  ])

  if (earnings === null) return err('NOT_FOUND', 'Creator not found', 404)

  return ok({
    earnings: {
      totalCents: earnings._sum.creatorAmountCents ?? 0,
      transactionCount: earnings._count.id,
    },
    streams,
    followerCount,
    activeSubscribers: subCount,
    periodDays: days,
  })
}
