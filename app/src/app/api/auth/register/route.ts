import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { writeAuditLog } from '@/lib/audit'
import { registerSchema } from '@/lib/validations/auth'
import { rateLimit, ok, err, getIP } from '@/lib/middleware'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const limited = await rateLimit(ip, 'authEndpoints')
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const fields: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (!fields[key]) fields[key] = []
      fields[key].push(issue.message)
    }
    return err('VALIDATION_ERROR', 'Invalid input', 422, fields)
  }

  const { email, password, username, displayName } = parsed.data

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ])

  if (existingEmail) {
    return err('EMAIL_TAKEN', 'Email already registered', 409)
  }
  if (existingUsername) {
    return err('USERNAME_TAKEN', 'Username already taken', 409)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      username,
      displayName: displayName ?? username,
    },
    select: { id: true, email: true, username: true, displayName: true, role: true, tier: true },
  })

  await writeAuditLog({
    actorId: user.id,
    action: 'user.register',
    targetId: user.id,
    targetType: 'User',
    meta: { ip, username },
  })

  // Fire-and-forget; never block registration on email delivery
  sendWelcomeEmail(user.email, user.username)

  return ok({ user }, 201)
}
