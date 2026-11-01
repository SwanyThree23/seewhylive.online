'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { StatCard } from '@/components/ui/StatCard'
import { Btn } from '@/components/ui/Btn'
import { Input } from '@/components/ui/Input'

interface WalletData {
  walletCents: number
  recentEarnings: { amountCents: number; creatorAmountCents: number; type: string; createdAt: string }[]
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function WalletPage() {
  const { status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/users/me').then(r => r.json()),
      fetch('/api/creator/dashboard?days=30').then(r => r.json()),
    ]).then(([me, dash]) => {
      setData({
        walletCents: me.success ? me.data.user?.walletCents ?? 0 : 0,
        recentEarnings: dash.success ? [] : [],
      })
    }).finally(() => setLoading(false))
  }, [status])

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  async function requestPayout() {
    const cents = Math.round(parseFloat(payoutAmount) * 100)
    if (!cents || cents < 1000) { flash('err', 'Minimum payout is $10.00'); return }
    if (data && cents > data.walletCents) { flash('err', 'Amount exceeds wallet balance'); return }

    setPayoutLoading(true)
    try {
      const res = await fetch('/api/payments/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: cents }),
      })
      const d = await res.json()
      if (d.success) {
        flash('ok', `Payout of ${fmt(cents)} initiated.`)
        setPayoutAmount('')
        setData(prev => prev ? { ...prev, walletCents: prev.walletCents - cents } : prev)
      } else {
        flash('err', d.error?.message ?? 'Payout failed')
      }
    } finally {
      setPayoutLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-bebas text-hero text-text">WALLET</h1>

      {/* Balance */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Available Balance"
          value={data ? fmt(data.walletCents) : '—'}
          sub="ready to withdraw"
          accent="gold"
        />
        <StatCard
          label="Min Payout"
          value="$10.00"
          sub="Stripe transfer"
          accent="cyan"
        />
      </div>

      {/* Flash */}
      {msg && (
        <div className={`mb-6 rounded border px-4 py-3 font-barlow text-body
          ${msg.type === 'ok' ? 'border-green/40 bg-green/10 text-green' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Payout */}
      <div className="mb-8 rounded border border-border bg-card p-5">
        <p className="mb-1 font-bebas text-section tracking-widest text-text">REQUEST PAYOUT</p>
        <p className="mb-4 font-barlow text-body text-muted">
          Funds are transferred to your connected Stripe account within 2–5 business days.
        </p>
        <div className="flex gap-3">
          <Input
            type="number"
            min="10"
            step="0.01"
            value={payoutAmount}
            onChange={e => setPayoutAmount(e.target.value)}
            placeholder="0.00"
            prefix="$"
            className="max-w-[140px]"
          />
          <Btn
            onClick={requestPayout}
            loading={payoutLoading}
            disabled={!payoutAmount || !data?.walletCents}
            variant="gold"
          >
            Withdraw
          </Btn>
        </div>
        <p className="mt-2 font-barlow text-caption text-muted">
          Must have Stripe Connect set up in{' '}
          <a href="/settings" className="text-accent hover:underline">Settings → Monetize</a>.
        </p>
      </div>

      {/* Revenue model reminder */}
      <div className="rounded border border-border bg-card p-4">
        <p className="font-bebas text-label tracking-widest text-muted mb-1">REVENUE MODEL</p>
        <p className="font-barlow text-body text-muted">
          You keep <span className="text-green font-semibold">90%</span> of every tip, paywall, and subscription.
          SeeWhy earns 10% to keep the platform running. All payouts go directly to your Stripe account.
        </p>
      </div>
    </div>
  )
}
