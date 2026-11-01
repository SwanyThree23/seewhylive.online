'use client'

import { useState, FormEvent } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
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

interface CheckoutData {
  clientSecret: string
  paymentIntentId: string
  amountCents: number
}

function TipPaymentForm({ data, onSuccess, onCancel }: {
  data: CheckoutData
  onSuccess: () => void
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
      onSuccess()
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="font-barlow text-label text-muted">
        Amount: <span className="text-gold font-semibold">${(data.amountCents / 100).toFixed(2)}</span>
      </p>
      <PaymentElement />
      {error && <p className="font-barlow text-label text-red">{error}</p>}
      <div className="flex gap-2">
        <Btn type="submit" loading={loading} className="flex-1">
          SEND TIP
        </Btn>
        <Btn type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Back
        </Btn>
      </div>
    </form>
  )
}

export function TipModal({ open, onClose, toUserId, streamId, creatorName }: TipModalProps) {
  const [amountDollars, setAmountDollars] = useState<number>(5)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)

  const amountCents = Math.floor(amountDollars * 100)

  async function initTip() {
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
      if (!data.success) { setError(data.error?.message ?? 'Failed to initiate tip'); return }
      setCheckoutData({ clientSecret: data.data.clientSecret, paymentIntentId: data.data.paymentIntentId, amountCents })
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setCheckoutData(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Tip ${creatorName}`}>
      {checkoutData ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: checkoutData.clientSecret, appearance: { theme: 'night' } }}
        >
          <TipPaymentForm
            data={checkoutData}
            onSuccess={handleClose}
            onCancel={() => setCheckoutData(null)}
          />
        </Elements>
      ) : (
        <div className="flex flex-col gap-4">
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

          <Input
            label="Message (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={140}
            placeholder="Add a message…"
          />

          <p className="font-barlow text-label text-muted">
            {creatorName} receives <span className="text-green font-semibold">${(amountDollars * 0.9).toFixed(2)}</span>
            {' '}(90% of your tip)
          </p>

          {error && <p className="font-barlow text-label text-red">{error}</p>}

          <Btn onClick={initTip} loading={loading} className="w-full">
            SEND ${amountDollars} TIP
          </Btn>
        </div>
      )}
    </Modal>
  )
}
