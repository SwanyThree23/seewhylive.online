import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, ok, getIP } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(getIP(req), 'unauth')
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().slice(0, 100)
  const type = searchParams.get('type') ?? 'all' // all | streams | users
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 25)

  if (!q) return ok({ streams: [], users: [] })

  const [streams, users] = await Promise.all([
    type !== 'users'
      ? prisma.stream.findMany({
          where: {
            status: 'LIVE',
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true, title: true, genre: true, thumbnailUrl: true,
            viewerCount: true, isPaywalled: true,
            creator: { select: { username: true, displayName: true, avatarUrl: true } },
          },
        })
      : Promise.resolve([]),
    type !== 'streams'
      ? prisma.user.findMany({
          where: {
            deletedAt: null,
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true, username: true, displayName: true,
            avatarUrl: true, tier: true,
            _count: { select: { followers: true } },
          },
        })
      : Promise.resolve([]),
  ])

  return ok({ streams, users })
}
