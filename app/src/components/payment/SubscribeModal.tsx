'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Btn } from '@/components/ui/Btn'

interface SubTier {
  tier: string
  name: string
  priceCents: number
  description: string | null
  perks: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  creatorId: string
  creatorName: string
}

const TIER_COLORS: Record<string, string> = {
  FAN: 'text-accent border-accent/40 bg-accent/10',
  SUPPORTER: 'text-gold border-gold/40 bg-gold/10',
  RIDE_OR_DIE: 'text-purple border-purple/40 bg-purple/10',
}

export function SubscribeModal({ open, onClose, creatorId, creatorName }: Props) {
  const [tiers, setTiers] = useState<SubTier[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    fetch(`/api/creator/sub-tiers?creatorId=${creatorId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTiers(d.data.tiers.filter((t: SubTier & { isActive: boolean }) => t.isActive)) })
      .catch(() => {})
  }, [open, creatorId])

  async function subscribe(tier: string) {
    setLoading(tier)
    setError('')
    try {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, tier }),
      })
      const d = await res.json()
      if (!d.success) { setError(d.error?.message ?? 'Subscription failed'); return }
      window.location.href = d.data.checkoutUrl
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Subscribe to ${creatorName}`}>
      {tiers.length === 0 ? (
        <p className="font-barlow text-body text-muted py-4 text-center">
          No subscription tiers available yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {tiers.map(t => (
            <div
              key={t.tier}
              className={`rounded border p-4 ${TIER_COLORS[t.tier] ?? 'border-border bg-surface text-text'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-bebas text-section tracking-widest">{t.name}</p>
                  <p className="font-bebas text-label tracking-widest opacity-60">{t.tier}</p>
                </div>
                <p className="font-bebas text-hero leading-none shrink-0">
                  ${(t.priceCents / 100).toFixed(2)}
                  <span className="text-caption opacity-60">/mo</span>
                </p>
              </div>
              {t.description && (
                <p className="mb-3 font-barlow text-body opacity-80">{t.description}</p>
              )}
              {t.perks.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {t.perks.map((p, i) => (
                    <li key={i} className="font-barlow text-label opacity-70">✓ {p}</li>
                  ))}
                </ul>
              )}
              <Btn
                size="sm"
                onClick={() => subscribe(t.tier)}
                loading={loading === t.tier}
                className="w-full"
              >
                Subscribe — ${(t.priceCents / 100).toFixed(2)}/mo
              </Btn>
            </div>
          ))}
          <p className="font-barlow text-caption text-muted text-center">
            {creatorName} keeps <span className="text-green font-semibold">90%</span> of your subscription.
          </p>
        </div>
      )}
      {error && <p className="mt-2 font-barlow text-label text-red">{error}</p>}
    </Modal>
  )
}
