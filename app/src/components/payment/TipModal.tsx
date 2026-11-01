'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Modal } from '@/components/ui/Modal'
import { Btn } from '@/components/ui/Btn'
import { Input } from '@/components/ui/Input'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRESET_AMOUNTS = [1, 5, 10, 25, 50]

interface TipModalProps {
  open: boolean
  onClose: () => void
  toUserId: string
  streamId: string
  creatorName: string
}

export function TipModal({ open, onClose, toUserId, streamId, creatorName }: TipModalProps) {
  const [amountDollars, setAmountDollars] = useState<number>(5)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amountCents = Math.round(amountDollars * 100)

  const handleTip = async () => {
    if (amountCents < 100 || amountCents > 100000) {
      setError('Amount must be between $1 and $1000')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId, streamId, amountCents, note: note.trim() || undefined }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message ?? 'Failed to initiate tip')
        return
      }

      const stripe = await stripePromise
      if (!stripe) return

      const result = await stripe.confirmCardPayment(data.data.clientSecret)
      if (result.error) {
        setError(result.error.message ?? 'Payment failed')
      } else {
        onClose()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Tip ${creatorName}`}>
      <div className="flex flex-col gap-4">
        {/* Preset amounts */}
        <div>
          <p className="mb-2 font-bebas text-label tracking-widest text-muted">SELECT AMOUNT</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => setAmountDollars(amt)}
                className={`rounded border px-3 py-1.5 font-bebas text-section tracking-widest transition-colors
                  ${amountDollars === amt
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-border bg-surface text-muted hover:border-gold/50 hover:text-text'
                  }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <Input
          label="Custom Amount ($)"
          type="number"
          min="1"
          max="1000"
          step="1"
          value={amountDollars}
          onChange={e => setAmountDollars(Number(e.target.value))}
          prefix="$"
        />

        {/* Note */}
        <Input
          label="Message (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={140}
          placeholder="Add a message…"
        />

        {/* Creator gets info */}
        <p className="font-barlow text-label text-muted">
          {creatorName} receives <span className="text-green font-semibold">${(amountDollars * 0.9).toFixed(2)}</span>
          {' '}(90% of your tip)
        </p>

        {error && <p className="font-barlow text-label text-red">{error}</p>}

        <Btn onClick={handleTip} loading={loading} className="w-full">
          SEND ${amountDollars} TIP
        </Btn>
      </div>
    </Modal>
  )
}
