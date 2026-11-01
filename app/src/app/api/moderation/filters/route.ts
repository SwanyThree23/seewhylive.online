import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { z } from 'zod'

const addSchema = z.object({
  word: z.string().min(1).max(50).toLowerCase(),
})

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const filters = await prisma.creatorFilter.findMany({
    where: { creatorId: ctx.userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, word: true, createdAt: true },
  })

  return ok({ filters })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { word } = parsed.data

  // Check limit — max 200 filter words per creator
  const count = await prisma.creatorFilter.count({ where: { creatorId: ctx.userId } })
  if (count >= 200) return err('LIMIT_REACHED', 'Maximum 200 filter words allowed', 400)

  const existing = await prisma.creatorFilter.findFirst({
    where: { creatorId: ctx.userId, word },
  })
  if (existing) return err('CONFLICT', 'Word already filtered', 409)

  const filter = await prisma.creatorFilter.create({
    data: { creatorId: ctx.userId, word },
  })

  return ok({ filter }, 201)
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const { searchParams } = new URL(req.url)
  const filterId = searchParams.get('id')
  if (!filterId) return err('INVALID', 'id is required', 400)

  const filter = await prisma.creatorFilter.findUnique({ where: { id: filterId } })
  if (!filter) return err('NOT_FOUND', 'Filter not found', 404)
  if (filter.creatorId !== ctx.userId) return err('FORBIDDEN', 'Not your filter', 403)

  await prisma.creatorFilter.delete({ where: { id: filterId } })
  return ok({ deleted: true })
}
