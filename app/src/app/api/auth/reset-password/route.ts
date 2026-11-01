import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { writeAuditLog } from '@/lib/audit'
import { rateLimit, ok, err, getIP } from '@/lib/middleware'

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const limited = await rateLimit(ip, 'authEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { token, password } = parsed.data

  const userId = await redis.get(`pw_reset:${token}`)
  if (!userId) return err('INVALID_TOKEN', 'Reset token is invalid or expired', 400)

  const passwordHash = await bcrypt.hash(password, 12)

  await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    redis.del(`pw_reset:${token}`),
  ])

  await writeAuditLog({
    actorId: userId,
    action: 'user.password_reset',
    targetId: userId,
    targetType: 'User',
    meta: { ip },
  })

  return ok({ message: 'Password reset successfully.' })
}
