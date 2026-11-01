import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { payoutSchema } from '@/lib/validations/payment'
import { writeAuditLog } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'


export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'paymentEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = payoutSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { amountCents } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId, deletedAt: null },
    select: { walletCents: true, stripeConnectId: true },
  })

  if (!user) return err('NOT_FOUND', 'User not found', 404)
  if (!user.stripeConnectId) return err('NO_PAYOUT', 'Stripe Connect account not set up', 400)
  if (user.walletCents < amountCents) return err('INSUFFICIENT_FUNDS', 'Insufficient wallet balance', 400)

  // Create the Stripe transfer first — if it fails, wallet stays intact
  const transfer = await getStripe().transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: user.stripeConnectId,
  })

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: ctx.userId },
      data: { walletCents: { decrement: amountCents } },
      select: { walletCents: true },
    }),
    prisma.payment.create({
      data: {
        fromUserId: ctx.userId,
        toUserId: ctx.userId,
        type: 'PAYOUT',
        status: 'SUCCEEDED',
        amountCents,
        creatorAmountCents: amountCents,
        platformFeeCents: 0,
        stripePaymentIntentId: transfer.id,
      },
    }),
  ])

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'payment.payout.initiated',
    targetId: ctx.userId,
    targetType: 'User',
    meta: { amountCents },
  })

  createNotification({
    userId: ctx.userId,
    type: 'PAYOUT_PROCESSED',
    title: 'Payout Initiated',
    body: `$${(amountCents / 100).toFixed(2)} payout is on its way to your bank account`,
    data: { amountCents },
  })

  return ok({ newBalance: updatedUser.walletCents })
}
