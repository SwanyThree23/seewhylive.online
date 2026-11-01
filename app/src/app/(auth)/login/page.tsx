'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/discover')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-bebas text-hero text-text">SIGN IN</h1>
          <p className="mt-1 font-barlow text-body text-muted">Welcome back to SeeWhy LIVE</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="font-barlow text-label text-red">{error}</p>}

          <Btn type="submit" loading={loading} className="w-full mt-2">
            SIGN IN
          </Btn>
        </form>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => signIn('google', { callbackUrl: '/discover' })}
            className="w-full rounded border border-border bg-surface py-2.5 font-bebas tracking-widest text-muted transition-colors hover:text-text"
          >
            CONTINUE WITH GOOGLE
          </button>
        </div>

        <p className="mt-6 text-center font-barlow text-body text-muted">
          No account?{' '}
          <a href="/register" className="text-cyan transition-colors hover:text-cyan/80">
            Sign up
          </a>
        </p>
        <p className="mt-2 text-center font-barlow text-body text-muted">
          <a href="/forgot-password" className="text-muted transition-colors hover:text-text">
            Forgot password?
          </a>
        </p>
      </div>
    </div>
  )
}
