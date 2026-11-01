'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Btn } from '@/components/ui/Btn'
import { Input } from '@/components/ui/Input'

type Tab = 'profile' | 'password' | 'notifications' | 'monetization' | 'moderation' | 'danger'

interface FilterWord {
  id: string
  word: string
  createdAt: string
}

interface Profile {
  displayName: string
  bio: string
  avatarUrl: string | null
  twitterHandle: string | null
  instagramHandle: string | null
  websiteUrl: string | null
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  // Stripe Connect
  const [connectLoading, setConnectLoading] = useState(false)
  const [connectUrl, setConnectUrl] = useState<string | null>(null)

  // Sub-tiers
  const [subTiers, setSubTiers] = useState<Array<{
    id: string; tier: string; name: string; priceCents: number;
    description: string | null; isActive: boolean
  }>>([])

  // Sub-tier form
  const [tierForm, setTierForm] = useState<{
    tier: 'FAN' | 'SUPPORTER' | 'RIDE_OR_DIE'; name: string; priceCents: number; description: string
  }>({ tier: 'FAN', name: '', priceCents: 499, description: '' })
  const [tierSaving, setTierSaving] = useState(false)

  // Word filters
  const [filters, setFilters] = useState<FilterWord[]>([])
  const [filterWord, setFilterWord] = useState('')
  const [filterLoading, setFilterLoading] = useState(false)
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/users/me')
      .then(r => r.json())
      .then(d => {
        if (d.success) setProfile({
          displayName: d.data.user.displayName ?? '',
          bio: d.data.user.bio ?? '',
          avatarUrl: d.data.user.avatarUrl ?? null,
          twitterHandle: d.data.user.twitterHandle ?? '',
          instagramHandle: d.data.user.instagramHandle ?? '',
          websiteUrl: d.data.user.websiteUrl ?? '',
        })
      })
    fetch('/api/creator/sub-tiers')
      .then(r => r.json())
      .then(d => { if (d.success) setSubTiers(d.data.tiers) })
  }, [status])

  useEffect(() => {
    if (tab !== 'moderation' || filtersLoaded) return
    fetch('/api/moderation/filters')
      .then(r => r.json())
      .then(d => { if (d.success) { setFilters(d.data.filters); setFiltersLoaded(true) } })
      .catch(() => {})
  }, [tab, filtersLoaded])

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const d = await res.json()
      if (d.success) flash('ok', 'Profile saved.')
      else flash('err', d.error?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (newPw !== confirmPw) { flash('err', 'Passwords do not match'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: oldPw, newPassword: newPw }),
      })
      const d = await res.json()
      if (d.success) {
        flash('ok', 'Password updated.')
        setOldPw(''); setNewPw(''); setConfirmPw('')
      } else flash('err', d.error?.message ?? 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  async function startStripeConnect() {
    setConnectLoading(true)
    try {
      const res = await fetch('/api/creator/connect', { method: 'POST' })
      const d = await res.json()
      if (d.success) setConnectUrl(d.data.url)
      else flash('err', d.error?.message ?? 'Failed to connect Stripe')
    } finally {
      setConnectLoading(false)
    }
  }

  async function uploadAvatar(file: File) {
    const presignRes = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type, fileSizeMB: file.size / 1048576, purpose: 'avatar' }),
    })
    const presign = await presignRes.json()
    if (!presign.success) { flash('err', 'Failed to get upload URL'); return }

    await fetch(presign.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    setProfile(p => p ? { ...p, avatarUrl: presign.data.cdnUrl } : p)
    flash('ok', 'Avatar uploaded — save profile to apply.')
  }

  async function addFilterWord() {
    const word = filterWord.trim().toLowerCase()
    if (!word) return
    setFilterLoading(true)
    try {
      const res = await fetch('/api/moderation/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      })
      const d = await res.json()
      if (d.success) {
        setFilters(prev => [...prev, d.data.filter])
        setFilterWord('')
        flash('ok', `"${word}" added to word filter.`)
      } else {
        flash('err', d.error?.message ?? 'Failed to add word')
      }
    } finally {
      setFilterLoading(false)
    }
  }

  async function removeFilterWord(id: string, word: string) {
    const res = await fetch(`/api/moderation/filters?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) {
      setFilters(prev => prev.filter(f => f.id !== id))
      flash('ok', `"${word}" removed.`)
    } else {
      flash('err', d.error?.message ?? 'Failed to remove word')
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'PROFILE' },
    { id: 'password', label: 'PASSWORD' },
    { id: 'notifications', label: 'ALERTS' },
    { id: 'monetization', label: 'MONETIZE' },
    { id: 'moderation', label: 'MODERATION' },
    { id: 'danger', label: 'DANGER' },
  ]

  if (status === 'loading' || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-bebas text-hero text-text">SETTINGS</h1>

      {/* Tab bar */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-border pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 font-bebas text-label tracking-widest transition-colors border-b-2
              ${tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`mb-6 rounded border px-4 py-3 font-barlow text-body
          ${msg.type === 'ok' ? 'border-green/40 bg-green/10 text-green' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : <span className="font-bebas text-2xl text-muted">{session?.user?.name?.[0] ?? '?'}</span>}
            </div>
            <div>
              <Btn size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                Change Photo
              </Btn>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}
              />
              <p className="mt-1 font-barlow text-caption text-muted">JPG, PNG, WebP · Max 10MB</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">DISPLAY NAME</label>
              <Input
                value={profile.displayName}
                onChange={e => setProfile(p => p ? { ...p, displayName: e.target.value } : p)}
                maxLength={50}
              />
            </div>
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">USERNAME</label>
              <Input value={session?.user?.name ?? ''} disabled className="opacity-50 cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">BIO</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => p ? { ...p, bio: e.target.value } : p)}
              maxLength={500}
              rows={3}
              className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text placeholder:text-muted focus:border-accent focus:outline-none resize-none"
              placeholder="Tell the world about yourself..."
            />
            <p className="mt-1 text-right font-barlow text-caption text-muted">{profile.bio.length}/500</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">TWITTER</label>
              <Input
                value={profile.twitterHandle ?? ''}
                onChange={e => setProfile(p => p ? { ...p, twitterHandle: e.target.value } : p)}
                placeholder="@handle"
              />
            </div>
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">INSTAGRAM</label>
              <Input
                value={profile.instagramHandle ?? ''}
                onChange={e => setProfile(p => p ? { ...p, instagramHandle: e.target.value } : p)}
                placeholder="@handle"
              />
            </div>
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">WEBSITE</label>
              <Input
                value={profile.websiteUrl ?? ''}
                onChange={e => setProfile(p => p ? { ...p, websiteUrl: e.target.value } : p)}
                placeholder="https://..."
              />
            </div>
          </div>

          <Btn onClick={saveProfile} loading={saving} className="w-full sm:w-auto">
            Save Profile
          </Btn>
        </div>
      )}

      {/* ── PASSWORD ── */}
      {tab === 'password' && (
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">CURRENT PASSWORD</label>
            <Input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">NEW PASSWORD</label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">CONFIRM NEW PASSWORD</label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>
          <p className="font-barlow text-caption text-muted">
            Min 8 characters · uppercase · lowercase · number · special character
          </p>
          <Btn
            onClick={changePassword}
            loading={saving}
            disabled={!oldPw || !newPw || !confirmPw}
          >
            Update Password
          </Btn>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          <p className="font-barlow text-body text-muted">
            Notification preferences are managed per-device in the platform notification center.
            Tip and follow alerts are always on while your stream is live.
          </p>
          <div className="rounded border border-border bg-card p-4">
            <p className="font-bebas text-label tracking-widest text-muted mb-3">UNREAD NOTIFICATIONS</p>
            <Btn variant="secondary" onClick={() => router.push('/notifications')}>
              View Notifications
            </Btn>
          </div>
        </div>
      )}

      {/* ── MONETIZATION ── */}
      {tab === 'monetization' && (
        <div className="space-y-8">
          {/* Stripe Connect */}
          <div className="rounded border border-border bg-card p-5">
            <p className="font-bebas text-section tracking-widest text-text mb-1">STRIPE CONNECT</p>
            <p className="font-barlow text-body text-muted mb-4">
              Connect your Stripe account to receive tips, paywall payments, and subscription revenue.
              You keep <span className="text-green font-semibold">90%</span> of every transaction.
            </p>
            {connectUrl
              ? (
                <div className="rounded border border-gold/40 bg-gold/10 p-3">
                  <p className="font-barlow text-body text-gold mb-2">Your Stripe Connect link is ready:</p>
                  <a
                    href={connectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-barlow text-body text-cyan underline break-all"
                  >
                    Complete Stripe Setup →
                  </a>
                </div>
              )
              : (
                <Btn variant="gold" onClick={startStripeConnect} loading={connectLoading}>
                  Connect Stripe Account
                </Btn>
              )
            }
          </div>

          {/* Sub-tiers */}
          <div>
            <p className="font-bebas text-section tracking-widest text-text mb-4">SUBSCRIPTION TIERS</p>
            {subTiers.length === 0 ? (
              <p className="font-barlow text-body text-muted mb-4">No subscription tiers configured yet.</p>
            ) : (
              <div className="space-y-2 mb-6">
                {subTiers.map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded border border-border bg-card px-4 py-3">
                    <div>
                      <span className="font-bebas text-label tracking-widest text-accent mr-3">{t.tier}</span>
                      <span className="font-barlow text-body text-text">{t.name}</span>
                      <span className="ml-3 font-barlow text-body text-gold">
                        ${(t.priceCents / 100).toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bebas text-caption ${t.isActive ? 'text-green' : 'text-muted'}`}>
                        {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/creator/sub-tiers/${t.tier}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isActive: !t.isActive }),
                          })
                          const d = await res.json()
                          if (d.success) {
                            setSubTiers(prev => prev.map(s => s.id === t.id ? { ...s, isActive: !s.isActive } : s))
                          } else flash('err', d.error?.message ?? 'Failed to update tier')
                        }}
                        className="font-bebas text-caption text-muted hover:text-text transition-colors"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new tier */}
            {subTiers.length < 3 && (() => {
              const existing = new Set(subTiers.map(t => t.tier))
              const available = (['FAN', 'SUPPORTER', 'RIDE_OR_DIE'] as const).filter(t => !existing.has(t))
              if (available.length === 0) return null
              return (
                <div className="rounded border border-border bg-card p-4 space-y-4">
                  <p className="font-bebas text-label tracking-widest text-muted">ADD TIER</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-bebas text-caption tracking-widest text-muted">TIER</label>
                      <select
                        value={tierForm.tier}
                        onChange={e => setTierForm(f => ({ ...f, tier: e.target.value as 'FAN' | 'SUPPORTER' | 'RIDE_OR_DIE' }))}
                        className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text focus:border-accent focus:outline-none"
                      >
                        {available.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-bebas text-caption tracking-widest text-muted">DISPLAY NAME</label>
                      <Input
                        value={tierForm.name}
                        onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Fan Club"
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bebas text-caption tracking-widest text-muted">PRICE / MONTH ($)</label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={(tierForm.priceCents / 100).toFixed(2)}
                        onChange={e => setTierForm(f => ({ ...f, priceCents: Math.round(Number(e.target.value) * 100) }))}
                        prefix="$"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bebas text-caption tracking-widest text-muted">DESCRIPTION</label>
                      <Input
                        value={tierForm.description}
                        onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="What subscribers get..."
                        maxLength={200}
                      />
                    </div>
                  </div>
                  <Btn
                    size="sm"
                    loading={tierSaving}
                    disabled={!tierForm.name.trim()}
                    onClick={async () => {
                      setTierSaving(true)
                      try {
                        const res = await fetch('/api/creator/sub-tiers', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tier: tierForm.tier,
                            name: tierForm.name,
                            priceCents: tierForm.priceCents,
                            description: tierForm.description || undefined,
                          }),
                        })
                        const d = await res.json()
                        if (d.success) {
                          setSubTiers(prev => [...prev, d.data.tier])
                          setTierForm({ tier: 'FAN', name: '', priceCents: 499, description: '' })
                          flash('ok', 'Subscription tier created.')
                        } else flash('err', d.error?.message ?? 'Failed to create tier')
                      } finally {
                        setTierSaving(false)
                      }
                    }}
                  >
                    Create Tier
                  </Btn>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── MODERATION ── */}
      {tab === 'moderation' && (
        <div className="space-y-6">
          <div className="rounded border border-border bg-card p-5">
            <p className="font-bebas text-section tracking-widest text-text mb-1">WORD FILTER</p>
            <p className="font-barlow text-body text-muted mb-4">
              Messages containing these words are automatically removed from your chat.
              <span className="ml-2 font-semibold text-text">{filters.length}/200 words</span>
            </p>

            {/* Add word */}
            <div className="flex gap-2 mb-5">
              <Input
                value={filterWord}
                onChange={e => setFilterWord(e.target.value)}
                placeholder="Enter a word to block..."
                maxLength={50}
                className="max-w-xs"
                onKeyDown={e => { if (e.key === 'Enter') addFilterWord() }}
              />
              <Btn
                onClick={addFilterWord}
                loading={filterLoading}
                disabled={!filterWord.trim() || filters.length >= 200}
                size="sm"
              >
                Add Word
              </Btn>
            </div>

            {/* Filter list */}
            {filters.length === 0 ? (
              <p className="font-barlow text-body text-muted">No words filtered yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filters.map(f => (
                  <span
                    key={f.id}
                    className="flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 font-barlow text-body text-text"
                  >
                    {f.word}
                    <button
                      onClick={() => removeFilterWord(f.id, f.word)}
                      className="ml-1 text-muted hover:text-red-400 transition-colors leading-none"
                      aria-label={`Remove ${f.word}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DANGER ZONE ── */}
      {tab === 'danger' && (
        <div className="space-y-6">
          <div className="rounded border border-red-500/30 bg-red-500/5 p-5">
            <p className="font-bebas text-section tracking-widest text-red-400 mb-2">DELETE ACCOUNT</p>
            <p className="font-barlow text-body text-muted mb-4">
              Permanently delete your account and all associated content. This cannot be undone.
              Any pending wallet balance will be forfeited.
            </p>
            <Btn
              variant="danger"
              onClick={async () => {
                const confirmed = window.confirm(
                  'Are you absolutely sure? This will permanently delete your account.'
                )
                if (!confirmed) return
                const res = await fetch('/api/users/me', { method: 'DELETE' })
                const d = await res.json()
                if (d.success) {
                  await signOut({ callbackUrl: '/' })
                } else {
                  flash('err', d.error?.message ?? 'Failed to delete account')
                }
              }}
            >
              Delete My Account
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
