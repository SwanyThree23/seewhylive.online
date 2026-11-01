import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { rateLimit, ok, err, getIP } from '@/lib/middleware'
import { sendPasswordResetEmail } from '@/lib/email'

const TTL = 60 * 60 // 1 hour

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const limited = await rateLimit(ip, 'authEndpoints')
  if (limited) return limited

  let body: unknown
  try { body = await req.json() } catch { return err('INVALID_JSON', 'Invalid JSON', 400) }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid input', 422)

  const { email } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
    select: { id: true },
  })

  // Always return OK to prevent email enumeration
  if (!user) return ok({ message: 'If that email exists, a reset link has been sent.' })

  const token = crypto.randomBytes(32).toString('hex')
  await redis.setex(`pw_reset:${token}`, TTL, user.id)

  sendPasswordResetEmail(email, token).catch(() => {})

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] password reset token for ${email}: ${token}`)
  }

  return ok({ message: 'If that email exists, a reset link has been sent.' })
}
