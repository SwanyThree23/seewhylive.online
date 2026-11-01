import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'

const createTierSchema = z.object({
  tier: z.enum(['FAN', 'SUPPORTER', 'RIDE_OR_DIE']),
  name: z.string().min(1).max(50),
  priceCents: z.number().int().positive().max(100000),
  description: z.string().max(300).optional(),
  perks: z.array(z.string().max(100)).max(10).default([]),
  stripePriceId: z.string().optional(),
})


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const publicCreatorId = searchParams.get('creatorId')

  if (publicCreatorId) {
    // Public endpoint — show only active tiers for a specific creator
    const tiers = await prisma.creatorSubTier.findMany({
      where: { creatorId: publicCreatorId, isActive: true },
      orderBy: { tier: 'asc' },
      select: { id: true, tier: true, name: true, priceCents: true, description: true, perks: true },
    })
    return ok({ tiers })
  }

  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const tiers = await prisma.creatorSubTier.findMany({
    where: { creatorId: ctx.userId },
    orderBy: { tier: 'asc' },
  })

  return ok({ tiers })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = createTierSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { tier, name, priceCents, description, perks, stripePriceId } = parsed.data

  const existing = await prisma.creatorSubTier.findUnique({
    where: { creatorId_tier: { creatorId: ctx.userId, tier: tier as never } },
  })
  if (existing) return err('CONFLICT', `Tier ${tier} already exists`, 409)

  const subTier = await prisma.creatorSubTier.create({
    data: {
      creatorId: ctx.userId,
      tier: tier as never,
      name,
      priceCents,
      description,
      perks: perks as never,
      stripePriceId,
    },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'creator.sub_tier.create',
    targetId: subTier.id,
    targetType: 'CreatorSubTier',
    meta: { tier, priceCents },
  })

  return ok({ tier: subTier }, 201)
}
