'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.trim()) return
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success regardless of whether email exists (prevent enumeration)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 font-bebas text-hero text-text">RESET PASSWORD</h1>
      <p className="mb-8 font-barlow text-body text-muted">
        Enter your email and we&apos;ll send a reset link.
      </p>

      {sent ? (
        <div className="rounded border border-green/30 bg-green/10 p-5">
          <p className="font-bebas text-section tracking-widest text-green mb-1">CHECK YOUR EMAIL</p>
          <p className="font-barlow text-body text-muted">
            If that address is in our system, a reset link is on its way.
          </p>
          <Link href="/login" className="mt-4 block font-barlow text-body text-accent hover:underline">
            Back to sign in →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">EMAIL</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
            />
          </div>

          <Btn onClick={submit} loading={loading} className="w-full" disabled={!email.trim()}>
            Send Reset Link
          </Btn>

          <p className="text-center font-barlow text-caption text-muted">
            <Link href="/login" className="text-accent hover:underline">Back to sign in</Link>
          </p>
        </div>
      )}
    </div>
  )
}
