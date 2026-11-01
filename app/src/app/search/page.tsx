'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface StreamResult {
  id: string
  title: string
  genre: string
  thumbnailUrl: string | null
  viewerCount: number
  isPaywalled: boolean
  creator: { username: string; displayName: string | null; avatarUrl: string | null }
}

interface UserResult {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  tier: string
  _count: { followers: number }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState<'all' | 'streams' | 'users'>('all')
  const [streams, setStreams] = useState<StreamResult[]>([])
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string, t: typeof type) => {
    if (!query.trim()) { setStreams([]); setUsers([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${t}&limit=15`)
      const d = await res.json()
      if (d.success) {
        setStreams(d.data.streams ?? [])
        setUsers(d.data.users ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (q) {
        router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false })
        search(q, type)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [q, type, search, router])

  useEffect(() => {
    const initial = searchParams.get('q')
    if (initial) search(initial, type)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const TYPES: { id: typeof type; label: string }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'streams', label: 'LIVE STREAMS' },
    { id: 'users', label: 'CREATORS' },
  ]

  const empty = !loading && q.trim() && streams.length === 0 && users.length === 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 font-bebas text-hero text-text">SEARCH</h1>

      {/* Search input */}
      <div className="mb-6 relative">
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search streams, creators..."
          className="pr-10 text-lg"
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        )}
      </div>

      {/* Type filter */}
      <div className="mb-8 flex gap-2">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`rounded border px-3 py-1.5 font-bebas text-label tracking-widest transition-colors
              ${type === t.id ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {empty && (
        <p className="font-barlow text-body text-muted text-center py-12">
          No results for &ldquo;{q}&rdquo;
        </p>
      )}

      {!q.trim() && (
        <p className="font-barlow text-body text-muted text-center py-12">
          Start typing to search live streams and creators.
        </p>
      )}

      {/* Streams */}
      {(type === 'all' || type === 'streams') && streams.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-bebas text-section tracking-widest text-muted">LIVE STREAMS</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {streams.map(s => (
              <Link key={s.id} href={`/live/${s.id}`} className="group">
                <div className="rounded border border-border bg-card overflow-hidden transition-colors hover:border-accent/50">
                  <div className="relative aspect-video bg-surface">
                    {s.thumbnailUrl
                      ? <img src={s.thumbnailUrl} alt={s.title} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center">
                          <span className="font-bebas text-muted text-sm">NO PREVIEW</span>
                        </div>
                    }
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <Badge variant="live" dot>LIVE</Badge>
                      {s.isPaywalled && <Badge variant="gold">PPV</Badge>}
                    </div>
                    <div className="absolute bottom-2 right-2 font-bebas text-caption text-white bg-black/70 px-1.5 rounded">
                      {s.viewerCount.toLocaleString()} watching
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-barlow text-body text-text truncate group-hover:text-accent transition-colors">
                      {s.title}
                    </p>
                    <p className="font-barlow text-caption text-muted mt-0.5">
                      {s.creator.displayName ?? s.creator.username}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Users */}
      {(type === 'all' || type === 'users') && users.length > 0 && (
        <section>
          <h2 className="mb-4 font-bebas text-section tracking-widest text-muted">CREATORS</h2>
          <div className="space-y-2">
            {users.map(u => (
              <Link key={u.id} href={`/${u.username}`}>
                <div className="flex items-center gap-4 rounded border border-border bg-card px-4 py-3 hover:border-accent/50 transition-colors">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-surface border border-border flex-shrink-0 flex items-center justify-center">
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt={u.username} className="h-full w-full object-cover" />
                      : <span className="font-bebas text-muted">{u.username[0].toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-barlow text-body text-text font-semibold truncate">
                        {u.displayName ?? u.username}
                      </span>
                      {u.tier !== 'FREE' && (
                        <Badge variant={u.tier === 'DIAMOND' ? 'cyan' : u.tier === 'GOLD' ? 'gold' : 'purple'}>
                          {u.tier}
                        </Badge>
                      )}
                    </div>
                    <p className="font-barlow text-caption text-muted">
                      @{u.username} · {u._count.followers.toLocaleString()} followers
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
