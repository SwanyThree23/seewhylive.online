'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Btn } from '@/components/ui/Btn'
import { Input } from '@/components/ui/Input'

type AdminTab = 'users' | 'streams'

interface AdminUser {
  id: string
  username: string
  email: string
  displayName: string | null
  role: string
  tier: string
  createdAt: string
  deletedAt: string | null
  _count: { streams: number; followers: number }
}

interface AdminStream {
  id: string
  title: string
  status: string
  viewerCount: number
  genre: string
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  creator: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [streams, setStreams] = useState<AdminStream[]>([])
  const [streamCursor, setStreamCursor] = useState<string | null>(null)
  const [streamHasMore, setStreamHasMore] = useState(false)
  const [streamLoading, setStreamLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated' && session.user.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  async function loadUsers(reset = false) {
    setLoading(true)
    const c = reset ? undefined : cursor
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (search) params.set('search', search)
      if (c) params.set('cursor', c)
      const res = await fetch(`/api/admin/users?${params}`)
      const d = await res.json()
      if (d.success) {
        setUsers(prev => reset ? d.data.users : [...prev, ...d.data.users])
        setCursor(d.data.nextCursor)
        setHasMore(!!d.data.nextCursor)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    const t = setTimeout(() => loadUsers(true), 300)
    return () => clearTimeout(t)
  }, [search, status]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'streams') return
    if (streams.length === 0) loadStreams(true)
  }, [tab, status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadStreams(reset = false) {
    setStreamLoading(true)
    const c = reset ? undefined : streamCursor
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (c) params.set('cursor', c)
      const res = await fetch(`/api/admin/streams?${params}`)
      const d = await res.json()
      if (d.success) {
        setStreams(prev => reset ? d.data.streams : [...prev, ...d.data.streams])
        setStreamCursor(d.data.nextCursor)
        setStreamHasMore(!!d.data.nextCursor)
      }
    } finally {
      setStreamLoading(false)
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm('Soft-delete this user?')) return
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, deletedAt: new Date().toISOString() } : u))
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (status === 'authenticated' && session.user.role !== 'ADMIN') return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-bebas text-hero text-text">ADMIN</h1>
        <Badge variant="live">RESTRICTED</Badge>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {(['users', 'streams'] as AdminTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-bebas text-label tracking-widest border-b-2 transition-colors
              ${tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          <div className="mb-4 max-w-sm">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by username or email..."
            />
          </div>

          <div className="overflow-hidden rounded border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {['User', 'Role', 'Tier', 'Streams', 'Followers', 'Joined', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-bebas text-caption tracking-widest text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-cardHi ${u.deletedAt ? 'opacity-40' : ''}`}>
                    <td className="px-3 py-2.5">
                      <div>
                        <a href={`/${u.username}`} className="font-barlow text-body text-text hover:text-accent transition-colors">
                          {u.displayName ?? u.username}
                        </a>
                        <p className="font-barlow text-caption text-muted">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={u.role === 'ADMIN' ? 'live' : 'muted'}>{u.role}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={u.tier === 'DIAMOND' ? 'cyan' : u.tier === 'GOLD' ? 'gold' : 'muted'}>
                        {u.tier}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-bebas text-body text-text">{u._count.streams}</td>
                    <td className="px-3 py-2.5 font-bebas text-body text-text">{u._count.followers}</td>
                    <td className="px-3 py-2.5 font-barlow text-caption text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5">
                      {u.deletedAt
                        ? <Badge variant="muted">DELETED</Badge>
                        : <Badge variant="green">ACTIVE</Badge>
                      }
                    </td>
                    <td className="px-3 py-2.5">
                      {!u.deletedAt && u.role !== 'ADMIN' && (
                        <Btn
                          size="sm"
                          variant="danger"
                          loading={actionLoading === u.id}
                          onClick={() => deleteUser(u.id)}
                        >
                          Delete
                        </Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="py-4 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}

          {hasMore && !loading && (
            <div className="mt-4 text-center">
              <Btn variant="secondary" onClick={() => loadUsers(false)}>Load More</Btn>
            </div>
          )}
        </div>
      )}

      {tab === 'streams' && (
        <div>
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {['Creator', 'Title', 'Status', 'Viewers', 'Genre', 'Started', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-bebas text-caption tracking-widest text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {streams.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-cardHi">
                    <td className="px-3 py-2.5">
                      <a href={`/${s.creator.username}`} className="font-barlow text-body text-text hover:text-accent transition-colors">
                        {s.creator.displayName ?? s.creator.username}
                      </a>
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2.5 font-barlow text-body text-text">
                      {s.title}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={
                          s.status === 'LIVE' ? 'live'
                          : s.status === 'ENDED' ? 'muted'
                          : 'cyan'
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-bebas text-body text-text">
                      {s.viewerCount}
                    </td>
                    <td className="px-3 py-2.5 font-barlow text-caption text-muted">
                      {s.genre.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-2.5 font-barlow text-caption text-muted">
                      {s.startedAt ? new Date(s.startedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <a
                        href={`/live/${s.id}`}
                        className="font-bebas text-caption tracking-widest text-accent hover:underline"
                      >
                        VIEW
                      </a>
                    </td>
                  </tr>
                ))}
                {streams.length === 0 && !streamLoading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center font-barlow text-body text-muted">
                      No streams found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {streamLoading && (
            <div className="py-4 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}

          {streamHasMore && !streamLoading && (
            <div className="mt-4 text-center">
              <Btn variant="secondary" onClick={() => loadStreams(false)}>Load More</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
