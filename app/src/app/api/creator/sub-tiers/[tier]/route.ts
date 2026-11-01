import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'

const updateTierSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  priceCents: z.number().int().positive().max(100000).optional(),
  description: z.string().max(300).optional(),
  perks: z.array(z.string().max(100)).max(10).optional(),
  stripePriceId: z.string().optional(),
  isActive: z.boolean().optional(),
})

type Params = { params: Promise<{ tier: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  const { tier } = await params

  const existing = await prisma.creatorSubTier.findUnique({
    where: { creatorId_tier: { creatorId: ctx.userId, tier: tier as never } },
  })
  if (!existing) return err('NOT_FOUND', 'Tier not found', 404)

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = updateTierSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const updated = await prisma.creatorSubTier.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      ...(parsed.data.perks ? { perks: parsed.data.perks as never } : {}),
    },
  })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'creator.sub_tier.update',
    targetId: existing.id,
    targetType: 'CreatorSubTier',
    meta: parsed.data,
  })

  return ok({ tier: updated })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { tier } = await params

  const existing = await prisma.creatorSubTier.findUnique({
    where: { creatorId_tier: { creatorId: ctx.userId, tier: tier as never } },
  })
  if (!existing) return err('NOT_FOUND', 'Tier not found', 404)

  await prisma.creatorSubTier.delete({ where: { id: existing.id } })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'creator.sub_tier.delete',
    targetId: existing.id,
    targetType: 'CreatorSubTier',
  })

  return ok({ deleted: true })
}
