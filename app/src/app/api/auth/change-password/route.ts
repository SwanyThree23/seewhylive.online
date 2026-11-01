import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, rateLimit, ok, err, getIP } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/,
    'Password must be 8+ chars with uppercase, lowercase, number, and special character'
  ),
})

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if ('status' in ctx) return ctx

  const limited = await rateLimit(getIP(req), 'auth')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 422)
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, passwordHash: true },
  })
  if (!user || !user.passwordHash) {
    return err('INVALID', 'Cannot change password for OAuth accounts', 400)
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return err('INVALID', 'Current password is incorrect', 400)

  const hash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({ where: { id: ctx.userId }, data: { passwordHash: hash } })

  await writeAuditLog({
    actorId: ctx.userId,
    action: 'auth.password_change',
    targetId: ctx.userId,
    targetType: 'User',
    ipAddress: getIP(req),
  })

  return ok({ updated: true })
}
