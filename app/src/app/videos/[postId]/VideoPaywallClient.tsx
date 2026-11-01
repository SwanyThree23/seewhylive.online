'use client'

import { useState, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Btn } from '@/components/ui/Btn'
import { Badge } from '@/components/ui/Badge'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  postId: string
  amountCents: number
  creatorName: string
  onUnlocked: () => void
}

interface PaymentFormProps {
  amountCents: number
  paymentIntentId: string
  onUnlocked: () => void
  onCancel: () => void
}

function PaymentForm({ amountCents, paymentIntentId, onUnlocked, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    // Verify with server to update payment status before granting access
    try {
      const res = await fetch('/api/payments/video-paywall/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      })
      const d = await res.json()
      if (d.success && d.data.confirmed) {
        onUnlocked()
      } else {
        setError('Payment confirmed but access could not be granted. Please refresh.')
        setLoading(false)
      }
    } catch {
      setError('Payment confirmed but could not verify. Please refresh the page.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="relative z-10 flex w-full max-w-sm flex-col gap-4 px-4">
      <PaymentElement />
      {error && <p className="font-barlow text-caption text-red">{error}</p>}
      <div className="flex gap-2">
        <Btn type="submit" variant="gold" loading={loading} className="flex-1">
          PAY ${(amountCents / 100).toFixed(2)}
        </Btn>
        <Btn type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </form>
  )
}

export function VideoPaywallClient({ postId, amountCents, creatorName, onUnlocked }: Props) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutData, setCheckoutData] = useState<{ clientSecret: string; paymentIntentId: string } | null>(null)

  async function initPayment() {
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
      setCheckoutData({ clientSecret: d.data.clientSecret, paymentIntentId: d.data.paymentIntentId })
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (checkoutData) {
    return (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret: checkoutData.clientSecret, appearance: { theme: 'night' } }}
      >
        <PaymentForm
          amountCents={amountCents}
          paymentIntentId={checkoutData.paymentIntentId}
          onUnlocked={onUnlocked}
          onCancel={() => setCheckoutData(null)}
        />
      </Elements>
    )
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
      <Btn variant="gold" onClick={initPayment} loading={loading}>
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
