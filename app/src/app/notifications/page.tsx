'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Btn } from '@/components/ui/Btn'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, string> = {
  TIP_RECEIVED: '💰',
  NEW_FOLLOWER: '👤',
  SUBSCRIPTION: '⭐',
  STREAM_STARTING: '📡',
  PAYOUT_PROCESSED: '💳',
  GIFT_RECEIVED: '🎁',
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  async function load(reset = false) {
    if (status !== 'authenticated') return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (!reset && cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/notifications?${params}`)
      const d = await res.json()
      if (d.success) {
        setItems(prev => reset ? d.data.items : [...prev, ...d.data.items])
        setCursor(d.data.nextCursor)
        setHasMore(!!d.data.nextCursor)
        setUnreadCount(d.data.unreadCount)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') load(true)
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setItems(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } finally {
      setMarkingAll(false)
    }
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  if (status === 'loading' || (loading && items.length === 0)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-hero text-text">NOTIFICATIONS</h1>
          {unreadCount > 0 && (
            <p className="font-barlow text-body text-muted">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Btn size="sm" variant="secondary" onClick={markAllRead} loading={markingAll}>
            Mark All Read
          </Btn>
        )}
      </div>

      {items.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-bebas text-section text-muted">ALL CLEAR</p>
          <p className="mt-2 font-barlow text-body text-muted">No notifications yet.</p>
        </div>
      )}

      <div className="space-y-1">
        {items.map(n => (
          <div
            key={n.id}
            onClick={() => { if (!n.isRead) markRead(n.id) }}
            className={`flex gap-4 rounded border px-4 py-3.5 transition-colors cursor-pointer
              ${n.isRead
                ? 'border-border bg-card hover:bg-cardHi'
                : 'border-accent/30 bg-accent/5 hover:bg-accent/10'
              }`}
          >
            <span className="text-2xl flex-shrink-0 mt-0.5" role="img" aria-label={n.type}>
              {TYPE_ICON[n.type] ?? '🔔'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-barlow text-body ${n.isRead ? 'text-text' : 'text-text font-semibold'}`}>
                  {n.title}
                </p>
                <span className="font-barlow text-caption text-muted flex-shrink-0">
                  {timeAgo(n.createdAt)}
                </span>
              </div>
              <p className="font-barlow text-body text-muted mt-0.5">{n.body}</p>
            </div>
            {!n.isRead && (
              <div className="mt-1.5 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Btn variant="secondary" onClick={() => load(false)} loading={loading}>
            Load More
          </Btn>
        </div>
      )}
    </div>
  )
}
