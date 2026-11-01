'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Btn } from '@/components/ui/Btn'
import { Badge } from '@/components/ui/Badge'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  postId: string
  amountCents: number
  creatorName: string
  onUnlocked: () => void
}

export function VideoPaywallClient({ postId, amountCents, creatorName, onUnlocked }: Props) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function unlock() {
    if (!session) { window.location.href = '/login'; return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/video-paywall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const d = await res.json()
      if (!d.success) { setError(d.error?.message ?? 'Payment failed'); return }
      if (d.data.alreadyUnlocked) { onUnlocked(); return }

      const stripe = await stripePromise
      if (!stripe) { setError('Stripe failed to load'); return }

      const { error: stripeError } = await stripe.confirmCardPayment(d.data.clientSecret)
      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed')
      } else {
        onUnlocked()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 flex flex-col items-center gap-4 text-center">
      <Badge variant="gold" className="mb-1">PAY-PER-VIEW</Badge>
      <p className="font-bebas text-page text-text">
        ${(amountCents / 100).toFixed(2)} to unlock
      </p>
      <p className="font-barlow text-body text-muted">
        Hosted by <span className="text-text">{creatorName}</span>
      </p>
      <Btn variant="gold" onClick={unlock} loading={loading}>
        UNLOCK VIDEO — ${(amountCents / 100).toFixed(2)}
      </Btn>
      {!session && (
        <p className="font-barlow text-caption text-muted">
          <a href="/login" className="text-accent hover:underline">Sign in</a> to purchase
        </p>
      )}
      {error && <p className="font-barlow text-caption text-red">{error}</p>}
    </div>
  )
}
