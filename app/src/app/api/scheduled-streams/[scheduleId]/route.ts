import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'

type Params = { params: Promise<{ scheduleId: string }> }

export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { scheduleId } = await params

  const stream = await prisma.scheduledStream.findUnique({ where: { id: scheduleId } })
  if (!stream) return err('NOT_FOUND', 'Scheduled stream not found', 404)
  if (stream.hostId !== ctx.userId && ctx.role !== 'ADMIN') {
    return err('FORBIDDEN', 'Not your scheduled stream', 403)
  }

  await prisma.scheduledStream.delete({ where: { id: scheduleId } })
  return ok({ deleted: true })
}
