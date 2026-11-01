import { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: string
      tier: string
      username: string
    }
  }

  interface User {
    role?: string
    tier?: string
    username?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string
    role?: string
    tier?: string
    username?: string
  }
}
