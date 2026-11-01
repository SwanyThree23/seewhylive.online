'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'
import { StatCard } from '@/components/ui/StatCard'

const GENRES = ['TALK_SHOW', 'MUSIC', 'LIFESTYLE', 'COMMUNITY', 'PANEL', 'COMEDY', 'SPORTS', 'GAMING', 'EDUCATION', 'OTHER']

export default function StudioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: 'TALK_SHOW',
    panelCount: 4,
    isPaywalled: false,
    paywallAmountCents: 500,
    auraEnabled: false,
    auraPersonality: 'HYPE' as 'SASSY' | 'HYPE' | 'CALM' | 'KIND',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'loading') return null
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleGoLive = async () => {
    if (!form.title.trim()) {
      setError('Stream title is required')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        paywallAmountCents: form.isPaywalled ? form.paywallAmountCents : undefined,
      }),
    })
    const data = await res.json()

    if (!data.success) {
      setError(data.error?.message ?? 'Failed to create stream')
      setLoading(false)
      return
    }

    router.push(`/live/${data.data.id}`)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 font-bebas text-hero text-text">STUDIO</h1>
      <p className="mb-8 font-barlow text-body text-muted">Set up your broadcast</p>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column — stream setup */}
        <div className="flex flex-col gap-5">
          <Input
            label="Stream Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What are you broadcasting today?"
            maxLength={120}
          />

          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">GENRE</label>
            <select
              value={form.genre}
              onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
              className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text focus:border-cyan/50 focus:outline-none"
            >
              {GENRES.map(g => (
                <option key={g} value={g}>{g.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">PANEL SLOTS: {form.panelCount}</label>
            <input
              type="range"
              min="1"
              max="9"
              value={form.panelCount}
              onChange={e => setForm(f => ({ ...f, panelCount: Number(e.target.value) }))}
              className="w-full accent-accent"
            />
          </div>

          {/* Paywall toggle */}
          <div className="flex items-center justify-between rounded border border-border bg-surface p-3">
            <div>
              <p className="font-bebas text-section tracking-widest text-text">PAY-PER-VIEW</p>
              <p className="font-barlow text-label text-muted">Charge viewers to join</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, isPaywalled: !f.isPaywalled }))}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isPaywalled ? 'bg-gold' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isPaywalled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {form.isPaywalled && (
            <Input
              label="PPV Price ($)"
              type="number"
              min="1"
              max="100"
              value={form.paywallAmountCents / 100}
              onChange={e => setForm(f => ({ ...f, paywallAmountCents: Math.round(Number(e.target.value) * 100) }))}
              prefix="$"
            />
          )}

          {/* AURA toggle */}
          <div className="flex items-center justify-between rounded border border-purple/30 bg-purple/5 p-3">
            <div>
              <p className="font-bebas text-section tracking-widest text-purple">AURA AI CO-HOST</p>
              <p className="font-barlow text-label text-muted">AI that engages your audience</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, auraEnabled: !f.auraEnabled }))}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.auraEnabled ? 'bg-purple' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.auraEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {error && <p className="font-barlow text-label text-red">{error}</p>}

          <Btn onClick={handleGoLive} loading={loading} size="lg" className="w-full">
            GO LIVE NOW
          </Btn>
        </div>

        {/* Right column — stats */}
        <div className="flex flex-col gap-4">
          <p className="font-bebas text-section tracking-widest text-muted">YOUR STATS</p>
          <StatCard label="Followers" value="—" />
          <StatCard label="Total Earned (30d)" value="$—" accent="gold" />
          <StatCard label="Active Subscribers" value="—" accent="cyan" />

          <div className="rounded border border-border bg-card p-4">
            <p className="mb-2 font-bebas text-section tracking-widest text-muted">REVENUE SPLIT</p>
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded bg-green/20 p-3 text-center">
                <p className="font-bebas text-stat text-green">90%</p>
                <p className="font-bebas text-label tracking-widest text-green/70">YOU KEEP</p>
              </div>
              <div className="w-12 rounded bg-border p-3 text-center">
                <p className="font-bebas text-section text-muted">10%</p>
                <p className="font-bebas text-label tracking-widest text-muted">PLATFORM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
