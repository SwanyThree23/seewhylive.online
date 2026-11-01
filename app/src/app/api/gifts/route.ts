import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'

const CREATOR_SPLIT = 0.90
const PLATFORM_FEE = 0.10

const sendGiftSchema = z.object({
  giftTypeId: z.string().uuid(),
  toUserId: z.string().uuid(),
  streamId: z.string().uuid().optional(),
  message: z.string().max(200).optional(),
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

  const { giftTypeId, toUserId, streamId, message } = parsed.data

  if (toUserId === ctx.userId) return err('INVALID', 'Cannot send gift to yourself', 400)

  const [giftType, recipient] = await Promise.all([
    prisma.giftType.findUnique({ where: { id: giftTypeId } }),
    prisma.user.findUnique({ where: { id: toUserId }, select: { id: true, stripeConnectId: true } }),
  ])

  if (!giftType || !giftType.isActive) return err('NOT_FOUND', 'Gift type not found', 404)
  if (!recipient) return err('NOT_FOUND', 'Recipient not found', 404)
  if (!recipient.stripeConnectId) return err('INVALID', 'Creator has not connected Stripe', 400)

  const platformFeeCents = Math.floor(giftType.amountCents * PLATFORM_FEE)
  const creatorShareCents = Math.floor(giftType.amountCents * CREATOR_SPLIT)

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: giftType.amountCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: platformFeeCents,
    transfer_data: { destination: recipient.stripeConnectId },
    metadata: {
      type: 'gift',
      giftTypeId,
      senderId: ctx.userId,
      recipientId: toUserId,
      streamId: streamId ?? '',
    },
  })

  const payment = await prisma.payment.create({
    data: {
      fromUserId: ctx.userId,
      toUserId,
      type: 'GIFT',
      amountCents: giftType.amountCents,
      platformFeeCents,
      creatorAmountCents: creatorShareCents,
      stripePaymentIntentId: paymentIntent.id,
      status: 'PENDING',
      streamId: streamId ?? null,
      note: message,
    },
  })

  return ok({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    paymentId: payment.id,
    giftName: giftType.name,
    giftIcon: giftType.icon,
    auraMessage: giftType.auraMessage,
    creatorReceivesCents: creatorShareCents,
  }, 201)
}
