import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'

type Params = { params: Promise<{ roomId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { roomId } = await params
  const room = await prisma.audioRoom.findUnique({
    where: { id: roomId },
    select: {
      id: true, title: true, isLive: true, listenerCount: true, createdAt: true,
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })
  if (!room) return err('NOT_FOUND', 'Room not found', 404)
  return ok({ room })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { roomId } = await params
  const room = await prisma.audioRoom.findUnique({ where: { id: roomId } })
  if (!room) return err('NOT_FOUND', 'Room not found', 404)
  if (room.hostId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not the host', 403)
  }

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const data: { isLive?: boolean; listenerCount?: number } = {}
  const b = body as Record<string, unknown>
  if (typeof b.isLive === 'boolean') data.isLive = b.isLive
  if (typeof b.listenerCount === 'number') data.listenerCount = Math.max(0, b.listenerCount)

  const updated = await prisma.audioRoom.update({ where: { id: roomId }, data })
  return ok({ room: updated })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { roomId } = await params
  const room = await prisma.audioRoom.findUnique({ where: { id: roomId } })
  if (!room) return err('NOT_FOUND', 'Room not found', 404)
  if (room.hostId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not the host', 403)
  }

  await prisma.audioRoom.delete({ where: { id: roomId } })
  return ok({ deleted: true })
}
