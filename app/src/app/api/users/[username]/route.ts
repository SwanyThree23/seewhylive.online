import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { redis, REDIS_KEYS, CACHE_TTL } from '@/lib/redis'
import { ok, err } from '@/lib/middleware'

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } },
) {
  const { username } = params

  const cacheKey = REDIS_KEYS.creatorProfile(username)
  const cached = await redis.get(cacheKey)
  if (cached) {
    try { return ok(JSON.parse(cached)) } catch {}
  }

  const user = await prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      tier: true,
      twitterHandle: true,
      instagramHandle: true,
      websiteUrl: true,
      createdAt: true,
      _count: { select: { followers: true } },
      streams: {
        where: { status: 'LIVE' },
        take: 1,
        select: { id: true, title: true, genre: true, thumbnailUrl: true, viewerCount: true },
      },
    },
  })

  if (!user) return err('NOT_FOUND', 'User not found', 404)

  await redis.setex(cacheKey, CACHE_TTL.CREATOR_PROFILE, JSON.stringify(user))
  return ok(user)
}
