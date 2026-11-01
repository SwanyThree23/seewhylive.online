'use client'

import { useState, FormEvent } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
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

function PaywallPaymentForm({ paymentIntentId, amountCents, onUnlocked, onCancel }: {
  paymentIntentId: string
  amountCents: number
  onUnlocked: () => void
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
      return
    }

    try {
      const res = await fetch('/api/payments/paywall/confirm', {
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
      setError('Payment confirmed but could not verify. Please refresh.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="font-barlow text-label text-muted">
        Unlock for <span className="text-gold font-semibold">{fmt(amountCents)}</span>
      </p>
      <PaymentElement />
      {error && <p className="font-barlow text-label text-red">{error}</p>}
      <div className="flex gap-2">
        <Btn type="submit" loading={loading} className="flex-1">
          UNLOCK {fmt(amountCents)}
        </Btn>
        <Btn type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Back
        </Btn>
      </div>
    </form>
  )
}

export function PaywallModal({ open, onClose, streamId, amountCents, creatorName, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutData, setCheckoutData] = useState<{ clientSecret: string; paymentIntentId: string } | null>(null)

  async function initUnlock() {
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
      if (data.data.alreadyUnlocked) { onUnlocked(); onClose(); return }
      setCheckoutData({ clientSecret: data.data.clientSecret, paymentIntentId: data.data.paymentIntentId })
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
    <Modal open={open} onClose={handleClose} title="Pay-Per-View Stream">
      {checkoutData ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: checkoutData.clientSecret, appearance: { theme: 'night' } }}
        >
          <PaywallPaymentForm
            paymentIntentId={checkoutData.paymentIntentId}
            amountCents={amountCents}
            onUnlocked={() => { onUnlocked(); handleClose() }}
            onCancel={() => setCheckoutData(null)}
          />
        </Elements>
      ) : (
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
          <Btn onClick={initUnlock} loading={loading} className="w-full">
            UNLOCK FOR {fmt(amountCents)}
          </Btn>
        </div>
      )}
    </Modal>
  )
}
