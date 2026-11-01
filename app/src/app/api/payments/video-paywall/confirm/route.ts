import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-10-28.endive' as never })

const confirmSchema = z.object({
  paymentIntentId: z.string().min(1).regex(/^pi_/),
})

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'paymentEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { paymentIntentId } = parsed.data

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntentId, fromUserId: ctx.userId },
    select: { id: true, status: true, toUserId: true, creatorAmountCents: true },
  })
  if (!payment) return err('NOT_FOUND', 'Payment not found', 404)

  if (payment.status === 'SUCCEEDED') return ok({ confirmed: true })

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (pi.status !== 'succeeded') {
    return err('NOT_CONFIRMED', 'Payment has not succeeded', 402)
  }

  // Atomically update only if still PENDING to avoid double-crediting alongside webhook
  const result = await prisma.payment.updateMany({
    where: { id: payment.id, status: 'PENDING' },
    data: { status: 'SUCCEEDED' },
  })

  if (result.count > 0 && payment.toUserId) {
    await prisma.user.update({
      where: { id: payment.toUserId },
      data: { walletCents: { increment: payment.creatorAmountCents } },
    })
    await writeAuditLog({
      actorId: ctx.userId,
      action: 'payment.video_paywall.confirmed',
      targetId: payment.id,
      targetType: 'Payment',
      meta: { paymentIntentId },
    })
  }

  return ok({ confirmed: true })
}
