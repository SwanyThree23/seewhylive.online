import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'

export async function POST(
  req: NextRequest,
  { params }: { params: { streamId: string } },
) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  const stream = await prisma.stream.findUnique({
    where: { id: params.streamId },
    select: {
      id: true,
      status: true,
      isPaywalled: true,
      paywallAmountCents: true,
      watchTier: true,
      panelCount: true,
      creatorId: true,
      panels: { select: { userId: true, slot: true } },
    },
  })

  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  if (stream.status !== 'LIVE') return err('STREAM_NOT_LIVE', 'Stream is not live', 400)

  // Check paywall
  if (stream.isPaywalled && stream.creatorId !== ctx.userId) {
    const paid = await prisma.payment.findFirst({
      where: {
        fromUserId: ctx.userId,
        streamId: params.streamId,
        type: 'PAYWALL_UNLOCK',
        status: 'SUCCEEDED',
      },
    })
    if (!paid) return err('PAYWALL', 'Paywall access required', 402)
  }

  // Increment viewer count atomically
  await prisma.stream.update({
    where: { id: params.streamId },
    data: { viewerCount: { increment: 1 } },
  })

  return ok({ joined: true, streamId: params.streamId })
}
