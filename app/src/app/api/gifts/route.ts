import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-10-28.endive' as never,
})

const CREATOR_SPLIT = 0.90
const PLATFORM_FEE = 0.10

const sendGiftSchema = z.object({
  giftTypeId: z.string().uuid(),
  recipientId: z.string().uuid(),
  streamId: z.string().uuid().optional(),
  message: z.string().max(200).optional(),
  paymentMethodId: z.string(),
})

export async function GET() {
  const giftTypes = await prisma.giftType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, icon: true, amountCents: true, auraMessage: true, sortOrder: true },
  })
  return ok({ giftTypes })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = sendGiftSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { giftTypeId, recipientId, streamId, message, paymentMethodId } = parsed.data

  if (recipientId === ctx.userId) return err('INVALID', 'Cannot send gift to yourself', 400)

  const [giftType, recipient] = await Promise.all([
    prisma.giftType.findUnique({ where: { id: giftTypeId } }),
    prisma.user.findUnique({ where: { id: recipientId }, select: { id: true, stripeConnectId: true } }),
  ])

  if (!giftType || !giftType.isActive) return err('NOT_FOUND', 'Gift type not found', 404)
  if (!recipient) return err('NOT_FOUND', 'Recipient not found', 404)
  if (!recipient.stripeConnectId) return err('INVALID', 'Creator has not connected Stripe', 400)

  const platformFeeCents = Math.floor(giftType.amountCents * PLATFORM_FEE)
  const creatorShareCents = Math.floor(giftType.amountCents * CREATOR_SPLIT)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: giftType.amountCents,
    currency: 'usd',
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    application_fee_amount: platformFeeCents,
    transfer_data: { destination: recipient.stripeConnectId },
    metadata: {
      type: 'gift',
      giftTypeId,
      senderId: ctx.userId,
      recipientId,
      streamId: streamId ?? '',
    },
  })

  const payment = await prisma.payment.create({
    data: {
      fromUserId: ctx.userId,
      toUserId: recipientId,
      type: 'TIP',
      amountCents: giftType.amountCents,
      platformFeeCents,
      creatorAmountCents: creatorShareCents,
      stripePaymentIntentId: paymentIntent.id,
      status: paymentIntent.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
      streamId: streamId ?? null,
      note: message,
    },
  })

  if (paymentIntent.status === 'succeeded') {
    await prisma.user.update({
      where: { id: recipientId },
      data: { walletCents: { increment: creatorShareCents } },
    })
    const sender = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { username: true } })
    if (sender) {
      createNotification({
        userId: recipientId,
        type: 'GIFT_RECEIVED' as const,
        title: 'Gift Received',
        body: `@${sender.username} sent you a ${giftType.icon} ${giftType.name}`,
        data: { senderUsername: sender.username, giftName: giftType.name, amountCents: giftType.amountCents },
      })
    }
  }

  return ok({
    paymentId: payment.id,
    status: payment.status,
    giftName: giftType.name,
    giftIcon: giftType.icon,
    auraMessage: giftType.auraMessage,
    creatorReceivesCents: creatorShareCents,
  }, 201)
}
