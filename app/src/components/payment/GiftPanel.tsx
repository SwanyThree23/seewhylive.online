'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Btn } from '@/components/ui/Btn'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface GiftType {
  id: string
  name: string
  icon: string
  amountCents: number
}

interface CheckoutData {
  clientSecret: string
  paymentIntentId: string
  gift: GiftType
}

interface Props {
  streamId: string
  toUserId: string
  creatorName: string
}

function GiftPaymentForm({ data, onSuccess, onCancel }: {
  data: CheckoutData
  onSuccess: (icon: string) => void
  onCancel: () => void
}) {
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
    } else {
      onSuccess(data.gift.icon)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="font-barlow text-body text-text">
          {data.gift.icon} {data.gift.name} — ${(data.gift.amountCents / 100).toFixed(2)}
        </span>
        <button type="button" onClick={onCancel} className="font-barlow text-caption text-muted hover:text-text">✕</button>
      </div>
      <PaymentElement options={{ layout: 'accordion' }} />
      {error && <p className="font-barlow text-[10px] text-red">{error}</p>}
      <div className="flex gap-2">
        <Btn type="submit" size="sm" loading={loading} className="flex-1">
          SEND GIFT
        </Btn>
        <Btn type="button" size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </form>
  )
}

export function GiftPanel({ streamId, toUserId, creatorName: _creatorName }: Props) {
  const { data: session } = useSession()
  const [gifts, setGifts] = useState<GiftType[]>([])
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingGiftId, setPendingGiftId] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/gifts')
      .then(r => r.json())
      .then(d => { if (d.success) setGifts(d.data.giftTypes ?? d.data.gifts ?? []) })
      .catch(() => {})
  }, [])

  async function selectGift(gift: GiftType) {
    if (!session) { setError('Sign in to send gifts'); return }
    setPendingGiftId(gift.id)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftTypeId: gift.id, toUserId, streamId }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error?.message ?? 'Gift failed'); return }
      setCheckoutData({ clientSecret: data.data.clientSecret, paymentIntentId: data.data.paymentIntentId, gift })
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
      setPendingGiftId(null)
    }
  }

  function handleSuccess(icon: string) {
    setCheckoutData(null)
    setSent(icon)
    setTimeout(() => setSent(null), 2500)
  }

  if (gifts.length === 0) return null

  return (
    <div className="border-t border-border">
      {checkoutData ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: checkoutData.clientSecret, appearance: { theme: 'night' } }}
        >
          <GiftPaymentForm
            data={checkoutData}
            onSuccess={handleSuccess}
            onCancel={() => setCheckoutData(null)}
          />
        </Elements>
      ) : (
        <div className="px-3 py-2">
          <p className="mb-2 font-bebas text-[10px] tracking-widest text-muted">SEND A GIFT</p>
          <div className="flex flex-wrap gap-1.5">
            {gifts.map(g => (
              <button
                key={g.id}
                onClick={() => selectGift(g)}
                disabled={loading && pendingGiftId === g.id}
                title={`${g.name} — $${(g.amountCents / 100).toFixed(2)}`}
                className="flex flex-col items-center rounded border border-border bg-surface px-2 py-1.5 transition-colors hover:border-gold/50 hover:bg-gold/5 disabled:opacity-50"
              >
                <span className="text-lg leading-none">{g.icon}</span>
                <span className="mt-0.5 font-barlow text-[9px] text-muted">${(g.amountCents / 100).toFixed(2)}</span>
              </button>
            ))}
          </div>
          {error && <p className="mt-1 font-barlow text-[10px] text-red">{error}</p>}
        </div>
      )}
      {sent && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50">
          <span className="animate-bounce text-8xl">{sent}</span>
        </div>
      )}
    </div>
  )
}
