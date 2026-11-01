'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Modal } from '@/components/ui/Modal'
import { Btn } from '@/components/ui/Btn'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  open: boolean
  onClose: () => void
  streamId: string
  amountCents: number
  creatorName: string
  onUnlocked: () => void
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function PaywallModal({ open, onClose, streamId, amountCents, creatorName, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function unlock() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/paywall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId }),
      })
      const data = await res.json()
      if (!data.success) {
        if (data.data?.alreadyUnlocked) { onUnlocked(); onClose(); return }
        setError(data.error?.message ?? 'Payment failed')
        return
      }

      const stripe = await stripePromise
      if (!stripe) return

      const result = await stripe.confirmCardPayment(data.data.clientSecret)
      if (result.error) {
        setError(result.error.message ?? 'Payment failed')
      } else {
        onUnlocked()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Pay-Per-View Stream">
      <div className="flex flex-col gap-4">
        <p className="font-barlow text-body text-muted">
          This stream by <span className="text-text font-semibold">{creatorName}</span> is pay-per-view.
          Unlock it once to watch the full broadcast.
        </p>
        <div className="flex items-center justify-between rounded border border-gold/30 bg-gold/10 px-4 py-3">
          <span className="font-bebas text-section tracking-widest text-text">ONE-TIME UNLOCK</span>
          <span className="font-bebas text-hero text-gold">{fmt(amountCents)}</span>
        </div>
        <p className="font-barlow text-label text-muted">
          {creatorName} receives <span className="text-green font-semibold">{fmt(Math.floor(amountCents * 0.9))}</span> (90%)
        </p>
        {error && <p className="font-barlow text-label text-red">{error}</p>}
        <Btn onClick={unlock} loading={loading} className="w-full">
          UNLOCK FOR {fmt(amountCents)}
        </Btn>
      </div>
    </Modal>
  )
}
