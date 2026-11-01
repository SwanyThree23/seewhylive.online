'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Btn } from '@/components/ui/Btn'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface GiftType {
  id: string
  name: string
  emoji: string
  priceCents: number
}

interface Props {
  streamId: string
  toUserId: string
  creatorName: string
}

export function GiftPanel({ streamId, toUserId, creatorName }: Props) {
  const { data: session } = useSession()
  const [gifts, setGifts] = useState<GiftType[]>([])
  const [selected, setSelected] = useState<GiftType | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/gifts')
      .then(r => r.json())
      .then(d => { if (d.success) setGifts(d.data.gifts) })
      .catch(() => {})
  }, [])

  async function sendGift(gift: GiftType) {
    if (!session) { setError('Sign in to send gifts'); return }
    setSelected(gift)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId, streamId, giftTypeId: gift.id, quantity: 1 }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error?.message ?? 'Gift failed'); return }

      const stripe = await stripePromise
      if (!stripe) return

      const result = await stripe.confirmCardPayment(data.data.clientSecret)
      if (result.error) {
        setError(result.error.message ?? 'Payment failed')
      } else {
        setSent(gift.emoji)
        setTimeout(() => setSent(null), 2500)
      }
    } finally {
      setLoading(false)
      setSelected(null)
    }
  }

  if (gifts.length === 0) return null

  return (
    <div className="border-t border-border px-3 py-2">
      <p className="mb-2 font-bebas text-[10px] tracking-widest text-muted">SEND A GIFT</p>
      <div className="flex flex-wrap gap-1.5">
        {gifts.map(g => (
          <button
            key={g.id}
            onClick={() => sendGift(g)}
            disabled={loading && selected?.id === g.id}
            title={`${g.name} — $${(g.priceCents / 100).toFixed(2)}`}
            className="flex flex-col items-center rounded border border-border bg-surface px-2 py-1.5 transition-colors hover:border-gold/50 hover:bg-gold/5 disabled:opacity-50"
          >
            <span className="text-lg leading-none">{g.emoji}</span>
            <span className="mt-0.5 font-barlow text-[9px] text-muted">${(g.priceCents / 100).toFixed(2)}</span>
          </button>
        ))}
      </div>
      {error && <p className="mt-1 font-barlow text-[10px] text-red">{error}</p>}
      {sent && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50">
          <span className="animate-bounce text-8xl">{sent}</span>
        </div>
      )}
    </div>
  )
}
