import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { paywallSchema, calcSplit } from '@/lib/validations/payment'
import { writeAuditLog } from '@/lib/audit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-10-28.endive' })

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'paymentEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = paywallSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { streamId } = parsed.data

  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    select: {
      id: true,
      isPaywalled: true,
      paywallAmountCents: true,
      creatorId: true,
      creator: { select: { stripeConnectId: true } },
    },
  })

  if (!stream) return err('NOT_FOUND', 'Stream not found', 404)
  if (!stream.isPaywalled || !stream.paywallAmountCents) return err('NOT_PAYWALLED', 'Stream is not paywalled', 400)
  if (!stream.creator.stripeConnectId) return err('NO_PAYOUT', 'Creator has not set up payouts', 400)

  // Idempotency check
  const existing = await prisma.payment.findFirst({
    where: {
      fromUserId: ctx.userId,
      streamId,
      type: 'PAYWALL_UNLOCK',
      status: 'SUCCEEDED',
    },
  })
  if (existing) return ok({ alreadyUnlocked: true })

  const amountCents = stream.paywallAmountCents
  const { creatorAmountCents, platformFeeCents } = calcSplit(amountCents)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    application_fee_amount: platformFeeCents,
    transfer_data: { destination: stream.creator.stripeConnectId },
    metadata: {
      type: 'paywall_unlock',
      fromUserId: ctx.userId,
      streamId,
    },
  })

  const payment = await prisma.payment.create({
    data: {
      fromUserId: ctx.userId,
      toUserId: stream.creatorId,
      streamId,
      type: 'PAYWALL_UNLOCK',
      status: 'PENDING',
      amountCents,
      creatorAmountCents,
      platformFeeCents,
      stripePaymentIntentId: paymentIntent.id,
    },
    select: { id: true },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'payment.paywall.initiated',
    targetId: payment.id,
    targetType: 'Payment',
    meta: { amountCents, streamId },
  })

  return ok({ clientSecret: paymentIntent.client_secret, paymentId: payment.id })
}
