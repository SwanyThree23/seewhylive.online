'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Btn } from '@/components/ui/Btn'

interface ConnectStatus {
  connected: boolean
  detailsSubmitted: boolean
  payoutsEnabled?: boolean
  chargesEnabled?: boolean
}

export default function StudioPayoutsPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const connected = searchParams.get('connected') === '1'
  const refresh = searchParams.get('refresh') === '1'

  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    fetch('/api/creator/connect')
      .then(r => r.json())
      .then(d => { if (d.success) setConnectStatus(d.data) })
      .finally(() => setLoading(false))
  }, [status, router])

  async function openConnectLink() {
    setLinking(true)
    try {
      const res = await fetch('/api/creator/connect', { method: 'POST' })
      const d = await res.json()
      if (d.success && d.data.url) window.location.href = d.data.url
    } finally {
      setLinking(false)
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 font-bebas text-hero text-text">PAYOUTS</h1>
      <p className="mb-8 font-barlow text-body text-muted">
        Connect Stripe to receive your earnings
      </p>

      {/* Status banner */}
      {connected && (
        <div className="mb-6 rounded border border-green/40 bg-green/10 px-4 py-3 font-barlow text-body text-green">
          Stripe account connected successfully.
        </div>
      )}
      {refresh && !connected && (
        <div className="mb-6 rounded border border-gold/40 bg-gold/10 px-4 py-3 font-barlow text-body text-gold">
          Your Stripe link expired. Click below to get a fresh one.
        </div>
      )}

      <div className="rounded border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bebas text-section tracking-widest text-text">STRIPE CONNECT</p>
            <p className="font-barlow text-body text-muted mt-0.5">
              Receive tips, paywall revenue, and subscriptions direct to your bank.
            </p>
          </div>
          {connectStatus && (
            <div className={`rounded px-3 py-1.5 font-bebas text-label tracking-widest
              ${connectStatus.payoutsEnabled
                ? 'bg-green/10 text-green border border-green/40'
                : connectStatus.connected
                  ? 'bg-gold/10 text-gold border border-gold/40'
                  : 'bg-surface text-muted border border-border'}`}>
              {connectStatus.payoutsEnabled ? 'ACTIVE' : connectStatus.connected ? 'PENDING' : 'NOT CONNECTED'}
            </div>
          )}
        </div>

        {connectStatus && connectStatus.connected && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Account', value: 'Connected' },
              { label: 'Details', value: connectStatus.detailsSubmitted ? 'Submitted' : 'Incomplete' },
              { label: 'Payouts', value: connectStatus.payoutsEnabled ? 'Enabled' : 'Pending' },
              { label: 'Charges', value: connectStatus.chargesEnabled ? 'Enabled' : 'Pending' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded border border-border bg-surface p-3 text-center">
                <p className="font-bebas text-caption tracking-widest text-muted">{label}</p>
                <p className="font-bebas text-label text-text mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Btn onClick={openConnectLink} loading={linking} variant={connectStatus?.payoutsEnabled ? 'secondary' : 'gold'}>
            {connectStatus?.connected ? 'Manage Stripe Account' : 'Connect Stripe'}
          </Btn>
          <Btn variant="ghost" onClick={() => router.push('/wallet')}>
            View Wallet
          </Btn>
        </div>

        <p className="font-barlow text-caption text-muted">
          You keep <span className="text-green font-semibold">90%</span> of every transaction.
          SeeWhy earns 10% to keep the platform running.
        </p>
      </div>
    </div>
  )
}
