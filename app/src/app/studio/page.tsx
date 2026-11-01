'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'
import { StatCard } from '@/components/ui/StatCard'

interface StudioStats {
  followerCount: number
  activeSubscribers: number
  earnings: { totalCents: number }
}

const GENRES = ['TALK_SHOW', 'MUSIC', 'LIFESTYLE', 'COMMUNITY', 'PANEL', 'COMEDY', 'SPORTS', 'GAMING', 'EDUCATION', 'OTHER']

type StudioTab = 'live' | 'video' | 'schedule'

export default function StudioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [studioTab, setStudioTab] = useState<StudioTab>('live')
  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: 'TALK_SHOW',
    panelCount: 4,
    isPaywalled: false,
    paywallAmountCents: 500,
    auraEnabled: false,
    auraPersonality: 'HYPE' as 'SASSY' | 'HYPE' | 'CALM' | 'KIND',
    thumbnailUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [error, setError] = useState('')
  const thumbRef = useRef<HTMLInputElement>(null)
  const videoThumbRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<StudioStats | null>(null)
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    videoUrl: '',
    durationSeconds: 0,
    isPaywalled: false,
    paywallAmountCents: 500,
  })
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoThumbUploading, setVideoThumbUploading] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)
  const [schedForm, setSchedForm] = useState({
    title: '',
    description: '',
    genre: 'TALK_SHOW',
    panelCount: 4,
    scheduledAt: '',
    notifyFollowers: true,
  })
  const [schedLoading, setSchedLoading] = useState(false)
  const [schedError, setSchedError] = useState('')
  const [schedSuccess, setSchedSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/creator/dashboard?days=30')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
      .catch(() => {})
  }, [])

  async function uploadThumbnail(file: File) {
    setThumbnailUploading(true)
    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, fileSizeMB: file.size / 1048576, purpose: 'thumbnail' }),
      })
      const presign = await presignRes.json()
      if (!presign.success) { setError('Failed to get upload URL'); return }
      await fetch(presign.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setForm(f => ({ ...f, thumbnailUrl: presign.data.cdnUrl }))
    } finally {
      setThumbnailUploading(false)
    }
  }

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
        thumbnailUrl: form.thumbnailUrl || undefined,
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

  async function uploadVideoFile(file: File) {
    setVideoUploading(true)
    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, fileSizeMB: file.size / 1048576, purpose: 'video' }),
      })
      const presign = await presignRes.json()
      if (!presign.success) { setVideoError('Failed to get upload URL'); return }
      await fetch(presign.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setVideoForm(f => ({ ...f, videoUrl: presign.data.cdnUrl }))
    } finally {
      setVideoUploading(false)
    }
  }

  async function uploadVideoThumbnail(file: File) {
    setVideoThumbUploading(true)
    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, fileSizeMB: file.size / 1048576, purpose: 'thumbnail' }),
      })
      const presign = await presignRes.json()
      if (!presign.success) { setVideoError('Failed to get upload URL'); return }
      await fetch(presign.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setVideoForm(f => ({ ...f, thumbnailUrl: presign.data.cdnUrl }))
    } finally {
      setVideoThumbUploading(false)
    }
  }

  async function handlePublishVideo() {
    if (!videoForm.title.trim()) { setVideoError('Title is required'); return }
    if (!videoForm.videoUrl) { setVideoError('Please upload a video file first'); return }
    setVideoLoading(true)
    setVideoError('')
    try {
      const res = await fetch('/api/video-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoForm.title.trim(),
          description: videoForm.description || undefined,
          thumbnailUrl: videoForm.thumbnailUrl || undefined,
          videoUrl: videoForm.videoUrl,
          durationSeconds: videoForm.durationSeconds || undefined,
          isPaywalled: videoForm.isPaywalled,
          paywallAmountCents: videoForm.isPaywalled ? videoForm.paywallAmountCents : undefined,
        }),
      })
      const d = await res.json()
      if (!d.success) { setVideoError(d.error?.message ?? 'Failed to create video'); return }
      // Immediately publish the video post
      await fetch(`/api/video-posts/${d.data.post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      })
      router.push(`/videos/${d.data.post.id}`)
    } finally {
      setVideoLoading(false)
    }
  }

  async function handleSchedule() {
    if (!schedForm.title.trim()) { setSchedError('Title is required'); return }
    if (!schedForm.scheduledAt) { setSchedError('Schedule date/time is required'); return }
    const scheduledAt = new Date(schedForm.scheduledAt)
    if (scheduledAt <= new Date()) { setSchedError('Scheduled time must be in the future'); return }
    setSchedLoading(true)
    setSchedError('')
    try {
      const res = await fetch('/api/scheduled-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schedForm, scheduledAt: scheduledAt.toISOString() }),
      })
      const d = await res.json()
      if (!d.success) { setSchedError(d.error?.message ?? 'Failed to schedule'); return }
      setSchedSuccess(true)
      setSchedForm(f => ({ ...f, title: '', description: '', scheduledAt: '' }))
    } finally {
      setSchedLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 font-bebas text-hero text-text">STUDIO</h1>
      <p className="mb-6 font-barlow text-body text-muted">Broadcast live or publish a video</p>

      {/* Studio mode tabs */}
      <div className="mb-8 flex gap-1 border-b border-border">
        {([
          { id: 'live', label: '📡 GO LIVE' },
          { id: 'video', label: '🎬 UPLOAD VIDEO' },
          { id: 'schedule', label: '📅 SCHEDULE' },
        ] as { id: StudioTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setStudioTab(t.id)}
            className={`px-5 py-2.5 font-bebas text-section tracking-widest border-b-2 transition-colors
              ${studioTab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {studioTab === 'video' && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            {/* Video file upload */}
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">VIDEO FILE</label>
              <div
                onClick={() => videoFileRef.current?.click()}
                className="relative flex h-24 cursor-pointer items-center justify-center rounded border-2 border-dashed border-border bg-surface transition-colors hover:border-accent/50"
              >
                <div className="text-center">
                  {videoUploading
                    ? <p className="font-bebas text-section tracking-widest text-muted">UPLOADING…</p>
                    : videoForm.videoUrl
                    ? <p className="font-bebas text-section tracking-widest text-green">VIDEO UPLOADED ✓</p>
                    : <><p className="font-bebas text-section tracking-widest text-muted">CLICK TO UPLOAD</p>
                       <p className="font-barlow text-caption text-muted">MP4 · MOV · Max 2GB</p></>
                  }
                </div>
                {videoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg/60">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                )}
              </div>
              <input
                ref={videoFileRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideoFile(f) }}
              />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">THUMBNAIL (optional)</label>
              <div
                onClick={() => videoThumbRef.current?.click()}
                className="relative flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-dashed border-border bg-surface transition-colors hover:border-accent/50"
              >
                {videoForm.thumbnailUrl
                  ? <img src={videoForm.thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                  : <p className="font-bebas text-section tracking-widest text-muted">
                      {videoThumbUploading ? 'UPLOADING…' : 'CLICK TO UPLOAD'}
                    </p>
                }
              </div>
              <input
                ref={videoThumbRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideoThumbnail(f) }}
              />
            </div>

            <Input
              label="Title"
              value={videoForm.title}
              onChange={e => setVideoForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What's this video about?"
              maxLength={120}
            />

            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">DESCRIPTION (optional)</label>
              <textarea
                value={videoForm.description}
                onChange={e => setVideoForm(f => ({ ...f, description: e.target.value }))}
                maxLength={2000}
                rows={3}
                placeholder="Describe your video..."
                className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text placeholder:text-muted focus:border-accent focus:outline-none resize-none"
              />
            </div>

            {/* PPV toggle */}
            <div className="flex items-center justify-between rounded border border-border bg-surface p-3">
              <div>
                <p className="font-bebas text-section tracking-widest text-text">PAY-PER-VIEW</p>
                <p className="font-barlow text-label text-muted">Charge to watch this video</p>
              </div>
              <button
                onClick={() => setVideoForm(f => ({ ...f, isPaywalled: !f.isPaywalled }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${videoForm.isPaywalled ? 'bg-gold' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${videoForm.isPaywalled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {videoForm.isPaywalled && (
              <Input
                label="PPV Price ($)"
                type="number"
                min="1"
                max="500"
                value={videoForm.paywallAmountCents / 100}
                onChange={e => setVideoForm(f => ({ ...f, paywallAmountCents: Math.round(Number(e.target.value) * 100) }))}
                prefix="$"
              />
            )}

            {videoError && <p className="font-barlow text-label text-red">{videoError}</p>}

            <Btn onClick={handlePublishVideo} loading={videoLoading} size="lg" className="w-full"
              disabled={!videoForm.videoUrl}>
              PUBLISH VIDEO
            </Btn>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <p className="font-bebas text-section tracking-widest text-muted">YOUR STATS</p>
            <StatCard label="Followers" value={stats ? stats.followerCount.toLocaleString() : '—'} />
            <StatCard label="Total Earned (30d)" value={stats ? `$${(stats.earnings.totalCents / 100).toFixed(2)}` : '—'} accent="gold" />
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
      )}

      {studioTab === 'schedule' && (
        <div className="max-w-lg">
          {schedSuccess && (
            <div className="mb-6 rounded border border-green/30 bg-green/5 p-4">
              <p className="font-bebas text-section tracking-widest text-green">STREAM SCHEDULED!</p>
              <p className="mt-1 font-barlow text-body text-muted">
                Your stream has been added to the schedule. View it on the{' '}
                <a href="/scheduled" className="text-accent hover:underline">schedule page</a>.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-5">
            <Input
              label="Stream Title"
              value={schedForm.title}
              onChange={e => setSchedForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What will you be streaming?"
              maxLength={120}
            />
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">DESCRIPTION (optional)</label>
              <textarea
                value={schedForm.description}
                onChange={e => setSchedForm(f => ({ ...f, description: e.target.value }))}
                maxLength={2000}
                rows={2}
                placeholder="Describe your upcoming stream..."
                className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text placeholder:text-muted focus:border-accent focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">GENRE</label>
              <select
                value={schedForm.genre}
                onChange={e => setSchedForm(f => ({ ...f, genre: e.target.value }))}
                className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text focus:border-accent focus:outline-none"
              >
                {GENRES.map(g => (
                  <option key={g} value={g}>{g.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">DATE & TIME</label>
              <input
                type="datetime-local"
                value={schedForm.scheduledAt}
                onChange={e => setSchedForm(f => ({ ...f, scheduledAt: e.target.value }))}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-bebas text-label tracking-widest text-muted">PANEL SLOTS: {schedForm.panelCount}</label>
              <input
                type="range"
                min="1"
                max="9"
                value={schedForm.panelCount}
                onChange={e => setSchedForm(f => ({ ...f, panelCount: Number(e.target.value) }))}
                className="w-full accent-accent"
              />
            </div>
            <div className="flex items-center justify-between rounded border border-border bg-surface p-3">
              <div>
                <p className="font-bebas text-section tracking-widest text-text">NOTIFY FOLLOWERS</p>
                <p className="font-barlow text-label text-muted">Send notification when stream starts</p>
              </div>
              <button
                onClick={() => setSchedForm(f => ({ ...f, notifyFollowers: !f.notifyFollowers }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${schedForm.notifyFollowers ? 'bg-accent' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${schedForm.notifyFollowers ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {schedError && <p className="font-barlow text-label text-red">{schedError}</p>}
            <Btn onClick={handleSchedule} loading={schedLoading} size="lg" className="w-full">
              SCHEDULE STREAM
            </Btn>
          </div>
        </div>
      )}

      {studioTab === 'live' && <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column — stream setup */}
        <div className="flex flex-col gap-5">
          {/* Thumbnail */}
          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">THUMBNAIL</label>
            <div
              onClick={() => thumbRef.current?.click()}
              className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-dashed border-border bg-surface transition-colors hover:border-accent/50"
            >
              {form.thumbnailUrl
                ? <img src={form.thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                : (
                  <div className="text-center">
                    <p className="font-bebas text-section tracking-widest text-muted">
                      {thumbnailUploading ? 'UPLOADING…' : 'CLICK TO UPLOAD'}
                    </p>
                    <p className="font-barlow text-caption text-muted">16:9 · JPG/PNG · Max 10MB</p>
                  </div>
                )
              }
              {thumbnailUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              )}
            </div>
            <input
              ref={thumbRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadThumbnail(f) }}
            />
            {form.thumbnailUrl && (
              <button
                onClick={() => setForm(f => ({ ...f, thumbnailUrl: '' }))}
                className="mt-1 font-barlow text-caption text-muted hover:text-red transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <Input
            label="Stream Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What are you broadcasting today?"
            maxLength={120}
          />

          <div>
            <label className="mb-1 block font-bebas text-label tracking-widest text-muted">DESCRIPTION (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={500}
              rows={2}
              placeholder="Tell viewers what this stream is about..."
              className="w-full rounded border border-border bg-surface px-3 py-2 font-barlow text-body text-text placeholder:text-muted focus:border-accent focus:outline-none resize-none"
            />
          </div>

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
          <div className="rounded border border-purple/30 bg-purple/5 p-3">
            <div className="flex items-center justify-between">
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
            {form.auraEnabled && (
              <div className="mt-3">
                <p className="mb-2 font-bebas text-caption tracking-widest text-purple/70">PERSONALITY</p>
                <div className="flex gap-2 flex-wrap">
                  {(['SASSY', 'HYPE', 'CALM', 'KIND'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, auraPersonality: p }))}
                      className={`rounded border px-3 py-1 font-bebas text-label tracking-widest transition-colors
                        ${form.auraPersonality === p
                          ? 'border-purple bg-purple/20 text-purple'
                          : 'border-border bg-surface text-muted hover:border-purple/40'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="font-barlow text-label text-red">{error}</p>}

          <Btn onClick={handleGoLive} loading={loading} size="lg" className="w-full">
            GO LIVE NOW
          </Btn>
        </div>

        {/* Right column — stats */}
        <div className="flex flex-col gap-4">
          <p className="font-bebas text-section tracking-widest text-muted">YOUR STATS</p>
          <StatCard
            label="Followers"
            value={stats ? stats.followerCount.toLocaleString() : '—'}
          />
          <StatCard
            label="Total Earned (30d)"
            value={stats ? `$${(stats.earnings.totalCents / 100).toFixed(2)}` : '—'}
            accent="gold"
          />
          <StatCard
            label="Active Subscribers"
            value={stats ? stats.activeSubscribers.toLocaleString() : '—'}
            accent="cyan"
          />

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
      </div>}
    </div>
  )
}
