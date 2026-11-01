import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { redis, CACHE_TTL, REDIS_KEYS } from '@/lib/redis'
import { loginSchema } from '@/lib/validations/auth'
import { writeAuditLog } from '@/lib/audit'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true, email: true, username: true, displayName: true,
            avatarUrl: true, role: true, tier: true, passwordHash: true,
            verified: true, deletedAt: true,
          },
        })

        if (!user || user.deletedAt || !user.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        await writeAuditLog({
          actorId: user.id,
          action: 'AUTH_LOGIN',
          targetType: 'User',
          targetId: user.id,
          ipAddress: (req?.headers?.['x-forwarded-for'] as string) ?? 'unknown',
        })

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.username,
          image: user.avatarUrl,
          role: user.role,
          tier: user.tier,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh sign-in — embed role/tier into the token
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, tier: true, username: true },
        })
        token.userId = user.id
        token.role = dbUser?.role ?? 'VIEWER'
        token.tier = dbUser?.tier ?? 'FREE'
        token.username = dbUser?.username ?? ''
      }
      // Cache the session in Redis on every token refresh
      if (token.userId) {
        await redis.setex(
          REDIS_KEYS.session(token.userId as string),
          CACHE_TTL.SESSION,
          JSON.stringify({ userId: token.userId, role: token.role, tier: token.tier }),
        )
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.tier = token.tier as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  events: {
    async signOut({ token }) {
      if (token?.userId) {
        await redis.del(REDIS_KEYS.session(token.userId as string))
      }
    },
  },
}
