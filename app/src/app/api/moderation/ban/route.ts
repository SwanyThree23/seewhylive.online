import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'

const banSchema = z.object({
  targetUserId: z.string().uuid(),
  streamId: z.string().uuid(),
  reason: z.string().max(200).optional(),
  durationHours: z.number().int().positive().max(8760).optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = banSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { targetUserId, streamId, reason, durationHours } = parsed.data

  // Verify requester owns the stream
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    select: { creatorId: true },
  })
  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  if (stream.creatorId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Only the stream creator can ban users', 403)
  }
  if (targetUserId === ctx.userId) return err('INVALID', 'Cannot ban yourself', 400)

  const expiresAt = durationHours
    ? new Date(Date.now() + durationHours * 3600 * 1000)
    : null

  await prisma.creatorBan.upsert({
    where: { creatorId_bannedUserId: { creatorId: ctx.userId, bannedUserId: targetUserId } },
    create: {
      creatorId: ctx.userId,
      bannedUserId: targetUserId,
      reason,
      expiresAt,
    },
    update: { reason, expiresAt },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'moderation.ban',
    targetId: targetUserId,
    targetType: 'User',
    meta: { streamId, reason, durationHours },
  })

  return ok({ banned: true, expiresAt })
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get('userId')
  if (!targetUserId) return err('INVALID', 'userId is required', 400)

  await prisma.creatorBan.deleteMany({
    where: { creatorId: ctx.userId, bannedUserId: targetUserId },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'moderation.unban',
    targetId: targetUserId,
    targetType: 'User',
  })

  return ok({ unbanned: true })
}
