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

  // Atomically decrement only if balance is still sufficient (race-safe).
  // A concurrent request may have spent the balance between our pre-flight
  // check above and now — the gte condition prevents going negative.
  let newBalance: number
  try {
    newBalance = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: ctx.userId, walletCents: { gte: amountCents } },
        data: { walletCents: { decrement: amountCents } },
      })
      if (updated.count === 0) throw Object.assign(new Error('INSUFFICIENT_FUNDS'), { code: 'WALLET_RACE' })
      await tx.payment.create({
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
      })
      const refreshed = await tx.user.findUnique({ where: { id: ctx.userId }, select: { walletCents: true } })
      return refreshed!.walletCents
    })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'WALLET_RACE') {
      // Balance was spent concurrently — reverse the transfer we already created
      await getStripe().transfers.createReversal(transfer.id).catch(() => {})
      return err('INSUFFICIENT_FUNDS', 'Insufficient wallet balance', 400)
    }
    throw e
  }
  const updatedUser = { walletCents: newBalance }

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
