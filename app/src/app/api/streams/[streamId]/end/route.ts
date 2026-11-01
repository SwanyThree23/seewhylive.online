import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: { streamId: string } },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const stream = await prisma.stream.findUnique({
    where: { id: params.streamId },
    select: { creatorId: true, status: true, title: true },
  })
  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  if (stream.creatorId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not authorized', 403)
  }
  if (stream.status === 'ENDED') return ok({ ended: true, alreadyEnded: true })

  const updated = await prisma.stream.update({
    where: { id: params.streamId },
    data: { status: 'ENDED', endedAt: new Date(), viewerCount: 0 },
    select: { id: true, status: true, endedAt: true },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'stream.end',
    targetId: params.streamId,
    targetType: 'Stream',
    meta: { title: stream.title },
  })

  return ok(updated)
}
