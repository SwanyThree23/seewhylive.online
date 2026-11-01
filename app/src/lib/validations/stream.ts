import { z } from 'zod'

export const createStreamSchema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(120),
  description: z.string().max(500).optional(),
  genre: z.enum([
    'TALK_SHOW', 'MUSIC', 'LIFESTYLE', 'COMMUNITY',
    'PANEL', 'COMEDY', 'SPORTS', 'GAMING', 'EDUCATION', 'OTHER',
  ]),
  panelCount: z.number().int().min(1).max(9),
  watchTier: z.enum(['FREE', 'CREATOR', 'PRO', 'STUDIO']).default('FREE'),
  isPaywalled: z.boolean().default(false),
  paywallAmountCents: z.number().int().min(100).max(10000).optional(),
  scheduledAt: z.string().datetime().optional(),
  auraEnabled: z.boolean().default(false),
  auraPersonality: z.enum(['SASSY', 'HYPE', 'CALM', 'KIND']).default('HYPE'),
})

export const updateStreamSchema = createStreamSchema.partial()

export type CreateStreamInput = z.infer<typeof createStreamSchema>
export type UpdateStreamInput = z.infer<typeof updateStreamSchema>
