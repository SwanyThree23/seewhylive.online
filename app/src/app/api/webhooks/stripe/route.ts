import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { writeAuditLog } from '@/lib/audit'
import { sendTipReceivedEmail, sendSubscriptionEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-10-28.endive' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await handlePaymentIntentSucceeded(pi)
      break
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await handlePaymentIntentFailed(pi)
      break
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutSessionCompleted(session)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(sub)
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: pi.id },
    select: { id: true, type: true, toUserId: true, fromUserId: true, creatorAmountCents: true },
  })
  if (!payment) return

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED' },
    }),
    // Credit wallet on tip/paywall
    ...(payment.type !== 'PAYOUT' && payment.toUserId
      ? [prisma.user.update({
          where: { id: payment.toUserId },
          data: { walletCents: { increment: payment.creatorAmountCents } },
        })]
      : []),
  ])

  // Send tip email notification
  if (payment.type === 'TIP' && payment.toUserId && payment.fromUserId) {
    const [creator, sender] = await Promise.all([
      prisma.user.findUnique({ where: { id: payment.toUserId }, select: { email: true, username: true } }),
      prisma.user.findUnique({ where: { id: payment.fromUserId }, select: { username: true } }),
    ])
    if (creator && sender) {
      sendTipReceivedEmail(creator.email, creator.username, sender.username, pi.amount, null)
    }
  }

  await writeAuditLog({
    actorId: payment.toUserId ?? 'system',
    action: 'payment.succeeded',
    targetId: payment.id,
    targetType: 'Payment',
    meta: { stripeId: pi.id, type: payment.type },
  })
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: pi.id },
    data: { status: 'FAILED' },
  })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return

  const { subscriberId, creatorId, tier } = session.metadata ?? {}
  if (!subscriberId || !creatorId || !tier) return

  const subTier = await prisma.creatorSubTier.findUnique({
    where: { creatorId_tier: { creatorId, tier: tier as never } },
    select: { priceCents: true },
  })
  if (!subTier) return

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.subscription.create({
      data: {
        subscriberId,
        creatorId,
        tier: tier as never,
        status: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: session.subscription as string,
      },
    }),
    prisma.payment.create({
      data: {
        fromUserId: subscriberId,
        toUserId: creatorId,
        type: 'SUBSCRIPTION',
        status: 'SUCCEEDED',
        amountCents: subTier.priceCents,
        creatorAmountCents: Math.floor(subTier.priceCents * 0.90),
        platformFeeCents: Math.floor(subTier.priceCents * 0.10),
        stripePaymentIntentId: session.payment_intent as string | undefined ?? undefined,
      },
    }),
    prisma.user.update({
      where: { id: creatorId },
      data: { walletCents: { increment: Math.floor(subTier.priceCents * 0.90) } },
    }),
  ])

  await writeAuditLog({
    actorId: subscriberId,
    action: 'subscription.created',
    targetId: creatorId,
    targetType: 'User',
    meta: { tier, sessionId: session.id },
  })

  // Send subscription email notification
  const [creator, subscriber, subTierInfo] = await Promise.all([
    prisma.user.findUnique({ where: { id: creatorId }, select: { email: true, username: true } }),
    prisma.user.findUnique({ where: { id: subscriberId }, select: { username: true } }),
    prisma.creatorSubTier.findUnique({
      where: { creatorId_tier: { creatorId, tier: tier as never } },
      select: { name: true, priceCents: true },
    }),
  ])
  if (creator && subscriber && subTierInfo) {
    sendSubscriptionEmail(
      creator.email,
      creator.username,
      subscriber.username,
      subTierInfo.name,
      Math.floor(subTierInfo.priceCents * 0.90),
    )
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })
}
