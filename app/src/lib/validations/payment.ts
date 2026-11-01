import { z } from 'zod'

const CREATOR_SPLIT = 0.90
const PLATFORM_FEE = 0.10

export function calcSplit(amountCents: number): {
  creatorAmountCents: number
  platformFeeCents: number
} {
  const platformFeeCents = Math.floor(amountCents * PLATFORM_FEE)
  const creatorAmountCents = amountCents - platformFeeCents
  return { platformFeeCents, creatorAmountCents }
}

export const tipSchema = z.object({
  toUserId: z.string().uuid(),
  streamId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(100000),
  note: z.string().max(140).optional(),
})

export const paywallSchema = z.object({
  streamId: z.string().uuid(),
})

export const videoPaywallSchema = z.object({
  postId: z.string().uuid(),
})

export const giftSchema = z.object({
  toUserId: z.string().uuid(),
  streamId: z.string().uuid(),
  giftTypeId: z.string().uuid(),
})

export const payoutSchema = z.object({
  amountCents: z.number().int().min(1000),
})

export const subscribeSchema = z.object({
  creatorId: z.string().uuid(),
  tier: z.enum(['FAN', 'SUPPORTER', 'RIDE_OR_DIE']),
})

export type TipInput = z.infer<typeof tipSchema>
export type PayoutInput = z.infer<typeof payoutSchema>
export type SubscribeInput = z.infer<typeof subscribeSchema>
