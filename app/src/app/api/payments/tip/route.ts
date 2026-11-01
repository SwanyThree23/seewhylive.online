import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { tipSchema, calcSplit } from '@/lib/validations/payment'
import { writeAuditLog } from '@/lib/audit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-10-28.endive' })

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'paymentEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = tipSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { toUserId, streamId, amountCents, note } = parsed.data

  const [recipient, stream] = await Promise.all([
    prisma.user.findUnique({
      where: { id: toUserId, deletedAt: null },
      select: { id: true, stripeConnectId: true, username: true },
    }),
    prisma.stream.findUnique({
      where: { id: streamId, status: 'LIVE' },
      select: { id: true },
    }),
  ])

  if (!recipient) return err('NOT_FOUND', 'Recipient not found', 404)
  if (!stream) return err('NOT_FOUND', 'Stream not found or not live', 404)
  if (!recipient.stripeConnectId) return err('NO_PAYOUT', 'Creator has not set up payouts', 400)

  const { creatorAmountCents, platformFeeCents } = calcSplit(amountCents)

  // Create PaymentIntent with application_fee_amount (platform earns 10%)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: platformFeeCents,
    transfer_data: { destination: recipient.stripeConnectId },
    metadata: {
      type: 'tip',
      fromUserId: ctx.userId,
      toUserId,
      streamId,
    },
  })

  // Create pending payment record — final status updated by Stripe webhook
  const payment = await prisma.payment.create({
    data: {
      fromUserId: ctx.userId,
      toUserId,
      streamId,
      type: 'TIP',
      status: 'PENDING',
      amountCents,
      creatorAmountCents,
      platformFeeCents,
      note,
      stripePaymentIntentId: paymentIntent.id,
    },
    select: { id: true, amountCents: true },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'payment.tip.initiated',
    targetId: payment.id,
    targetType: 'Payment',
    meta: { amountCents, toUserId, streamId },
  })

  return ok({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, paymentId: payment.id })
}
