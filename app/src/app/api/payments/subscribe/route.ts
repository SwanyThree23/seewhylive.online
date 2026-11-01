import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { subscribeSchema } from '@/lib/validations/payment'
import { writeAuditLog } from '@/lib/audit'


export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'paymentEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { creatorId, tier } = parsed.data

  const [creator, subTier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: creatorId, deletedAt: null },
      select: { id: true, stripeConnectId: true },
    }),
    prisma.creatorSubTier.findUnique({
      where: { creatorId_tier: { creatorId, tier } },
      select: { priceCents: true, stripePriceId: true },
    }),
  ])

  if (!creator) return err('NOT_FOUND', 'Creator not found', 404)
  if (!subTier) return err('NOT_FOUND', 'Subscription tier not configured', 404)
  if (!creator.stripeConnectId) return err('NO_PAYOUT', 'Creator has not set up payouts', 400)
  if (!subTier.stripePriceId) return err('NO_PRICE', 'Subscription price not configured', 400)

  // Check for existing active subscription
  const existing = await prisma.subscription.findFirst({
    where: {
      subscriberId: ctx.userId,
      creatorId,
      status: 'ACTIVE',
    },
  })
  if (existing) return err('ALREADY_SUBSCRIBED', 'Already subscribed', 409)

  // Create Stripe Checkout Session for subscription
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: subTier.stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/cancel`,
    metadata: {
      subscriberId: ctx.userId,
      creatorId,
      tier,
    },
    subscription_data: {
      application_fee_percent: 10,
      transfer_data: { destination: creator.stripeConnectId },
    },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'subscription.checkout.initiated',
    targetId: creatorId,
    targetType: 'User',
    meta: { tier, sessionId: session.id },
  })

  return ok({ checkoutUrl: session.url })
}
