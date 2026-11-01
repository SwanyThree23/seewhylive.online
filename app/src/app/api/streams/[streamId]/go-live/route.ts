import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { streamId: string } },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const stream = await prisma.stream.findUnique({
    where: { id: params.streamId },
    select: { creatorId: true, status: true, title: true, thumbnailUrl: true },
  })
  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  if (stream.creatorId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not authorized', 403)
  }
  if (stream.status === 'LIVE') return err('ALREADY_LIVE', 'Stream is already live', 400)
  if (stream.status === 'ENDED') return err('ENDED', 'Cannot restart an ended stream', 400)

  const updated = await prisma.stream.update({
    where: { id: params.streamId },
    data: { status: 'LIVE', startedAt: new Date() },
    select: { id: true, status: true, startedAt: true },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'stream.go_live',
    targetId: params.streamId,
    targetType: 'Stream',
    meta: { title: stream.title },
  })

  // Fire-and-forget: notify all followers
  prisma.follow.findMany({
    where: { followingId: stream.creatorId },
    select: { followerId: true },
    take: 500,
  }).then(follows => {
    const creator = prisma.user.findUnique({
      where: { id: stream.creatorId },
      select: { username: true, displayName: true },
    })
    return creator.then(c => {
      const displayName = c?.displayName ?? c?.username ?? 'Someone'
      return Promise.all(follows.map(f =>
        createNotification({
          userId: f.followerId,
          type: 'STREAM_STARTING',
          title: `${displayName} is live`,
          body: stream.title ?? 'Live stream started',
          data: { streamId: params.streamId, creatorId: stream.creatorId },
        })
      ))
    })
  }).catch(() => { /* non-critical */ })

  return ok(updated)
}
