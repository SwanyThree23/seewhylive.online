import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'
import { updateStreamSchema } from '@/lib/validations/stream'
import { writeAuditLog } from '@/lib/audit'

export async function GET(
  _req: NextRequest,
  { params }: { params: { streamId: string } },
) {
  const stream = await prisma.stream.findUnique({
    where: { id: params.streamId },
    select: {
      id: true,
      title: true,
      description: true,
      genre: true,
      status: true,
      viewerCount: true,
      thumbnailUrl: true,
      isPaywalled: true,
      paywallAmountCents: true,
      watchTier: true,
      panelCount: true,
      auraEnabled: true,
      auraPersonality: true,
      startedAt: true,
      endedAt: true,
      scheduledAt: true,
      playbackUrl: true,
      creator: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, tier: true },
      },
      panels: {
        select: {
          id: true, slot: true, role: true,
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  })

  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  return ok(stream)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { streamId: string } },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const stream = await prisma.stream.findUnique({
    where: { id: params.streamId },
    select: { creatorId: true },
  })
  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  if (stream.creatorId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not authorized', 403)
  }

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = updateStreamSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const updated = await prisma.stream.update({
    where: { id: params.streamId },
    data: parsed.data,
    select: { id: true, title: true, status: true },
  })

  return ok(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { streamId: string } },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const stream = await prisma.stream.findUnique({
    where: { id: params.streamId },
    select: { creatorId: true, title: true },
  })
  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  if (stream.creatorId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not authorized', 403)
  }

  await prisma.stream.update({
    where: { id: params.streamId },
    data: { status: 'ENDED', endedAt: new Date() },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'stream.end',
    targetId: params.streamId,
    targetType: 'Stream',
    meta: { title: stream.title },
  })

  return ok({ ended: true })
}
