import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { videoPaywallSchema, calcSplit } from '@/lib/validations/payment'
import { writeAuditLog } from '@/lib/audit'


export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'paymentEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = videoPaywallSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { postId } = parsed.data

  const post = await prisma.videoPost.findFirst({
    where: { id: postId, deletedAt: null, isPublished: true },
    select: {
      id: true,
      isPaywalled: true,
      paywallAmountCents: true,
      creatorId: true,
      creator: { select: { stripeConnectId: true } },
    },
  })

  if (!post) return err('NOT_FOUND', 'Video not found', 404)
  if (!post.isPaywalled || !post.paywallAmountCents) return err('NOT_PAYWALLED', 'Video is not paywalled', 400)
  if (!post.creator.stripeConnectId) return err('NO_PAYOUT', 'Creator has not set up payouts', 400)
  if (post.creatorId === ctx.userId) return err('OWN_CONTENT', 'Cannot purchase your own content', 400)

  const existing = await prisma.payment.findFirst({
    where: {
      fromUserId: ctx.userId,
      videoPostId: postId,
      type: 'PAYWALL_UNLOCK',
      status: 'SUCCEEDED',
    },
  })
  if (existing) return ok({ alreadyUnlocked: true })

  const amountCents = post.paywallAmountCents
  const { creatorAmountCents, platformFeeCents } = calcSplit(amountCents)

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: platformFeeCents,
    transfer_data: { destination: post.creator.stripeConnectId },
    metadata: {
      type: 'video_paywall_unlock',
      fromUserId: ctx.userId,
      postId,
    },
  })

  const payment = await prisma.payment.create({
    data: {
      fromUserId: ctx.userId,
      toUserId: post.creatorId,
      videoPostId: postId,
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
    action: 'payment.video_paywall.initiated',
    targetId: payment.id,
    targetType: 'Payment',
    meta: { amountCents, postId },
  })

  return ok({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, paymentId: payment.id })
}
