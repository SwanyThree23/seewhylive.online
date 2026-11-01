'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    if (!token) { setError('Missing reset token. Request a new link.'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const d = await res.json()
      if (d.success) {
        setDone(true)
        setTimeout(() => router.push('/login'), 2500)
      } else {
        setError(d.error?.message ?? 'Failed to reset password')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="font-bebas text-page text-muted">INVALID LINK</p>
        <Link href="/forgot-password" className="mt-4 block font-barlow text-body text-accent hover:underline">
          Request a new reset link
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 font-bebas text-hero text-text">NEW PASSWORD</h1>
      <p className="mb-8 font-barlow text-body text-muted">
        Choose a strong password to secure your account.
      </p>

      {done ? (
        <div className="rounded border border-green/30 bg-green/10 p-5 text-center">
          <p className="font-bebas text-section tracking-widest text-green">PASSWORD UPDATED</p>
          <p className="mt-2 font-barlow text-body text-muted">Redirecting you to sign in…</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">NEW PASSWORD</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">CONFIRM PASSWORD</label>
            <Input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
            />
          </div>
          <p className="font-barlow text-caption text-muted">
            8+ chars · uppercase · lowercase · number · special character
          </p>

          {error && <p className="font-barlow text-body text-red">{error}</p>}

          <Btn onClick={submit} loading={loading} className="w-full" disabled={!password || !confirm}>
            Reset Password
          </Btn>
        </div>
      )}
    </div>
  )
}
