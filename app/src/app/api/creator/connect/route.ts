import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'


export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId, deletedAt: null },
    select: { stripeConnectId: true, email: true },
  })
  if (!user) return err('NOT_FOUND', 'User not found', 404)

  let accountId = user.stripeConnectId

  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: 'express',
      email: user.email,
      capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
    })
    accountId = account.id

    await prisma.user.update({
      where: { id: ctx.userId },
      data: { stripeConnectId: accountId },
    })

    await writeAuditLog({
      actorId: ctx.userId,
      action: 'creator.connect.account_created',
      targetId: ctx.userId,
      targetType: 'User',
      meta: { stripeAccountId: accountId },
    })
  }

  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/studio/payouts?refresh=1`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/studio/payouts?connected=1`,
    type: 'account_onboarding',
  })

  return ok({ url: accountLink.url })
}

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { stripeConnectId: true },
  })
  if (!user?.stripeConnectId) return ok({ connected: false, detailsSubmitted: false })

  const account = await getStripe().accounts.retrieve(user.stripeConnectId)
  return ok({
    connected: true,
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
    chargesEnabled: account.charges_enabled,
  })
}
