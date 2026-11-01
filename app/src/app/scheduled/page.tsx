import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = { title: 'Scheduled Streams' }
export const revalidate = 60

interface ScheduledStream {
  id: string
  title: string
  description: string | null
  scheduledAt: string
  genre: string
  panelCount: number
  host: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

async function getScheduled(): Promise<ScheduledStream[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/scheduled-streams?upcoming=1&limit=50`,
      { next: { revalidate: 60 } },
    )
    const data = await res.json()
    return data.success ? data.data.streams : []
  } catch {
    return []
  }
}

function formatScheduledAt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms < 0) return null
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return 'Starting soon'
  if (h < 24) return `in ${h}h`
  const d = Math.floor(h / 24)
  return `in ${d}d`
}

export default async function ScheduledPage() {
  const streams = await getScheduled()
  // Extra filter: only future (API already filters, but guard client-side too)
  const upcoming = streams.filter(s => new Date(s.scheduledAt) > new Date())

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-bebas text-hero text-text">SCHEDULED</h1>
        <p className="font-barlow text-body text-muted">Upcoming streams from creators you follow</p>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-bebas text-page text-muted">NOTHING SCHEDULED YET</p>
          <p className="mt-2 font-barlow text-body text-muted">
            Creators will schedule upcoming streams here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(stream => {
            const eta = timeUntil(stream.scheduledAt)
            return (
              <div
                key={stream.id}
                className="flex items-center gap-4 rounded border border-border bg-card px-4 py-3 transition-colors hover:border-border/70"
              >
                {/* Time column */}
                <div className="w-28 shrink-0 text-right">
                  <p className="font-bebas text-label text-accent leading-none">{eta}</p>
                  <p className="mt-0.5 font-barlow text-caption text-muted leading-tight">
                    {formatScheduledAt(stream.scheduledAt)}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-10 w-px shrink-0 bg-border" />

                {/* Creator */}
                <Link
                  href={`/${stream.host.username}`}
                  className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
                >
                  <Avatar
                    src={stream.host.avatarUrl}
                    alt={stream.host.displayName ?? stream.host.username}
                    size={36}
                  />
                  <span className="hidden font-barlow text-body text-muted sm:block">
                    {stream.host.displayName ?? stream.host.username}
                  </span>
                </Link>

                {/* Title + genre */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bebas text-section text-text">{stream.title}</p>
                  {stream.description && (
                    <p className="truncate font-barlow text-caption text-muted">{stream.description}</p>
                  )}
                </div>

                {/* Badge */}
                <Badge variant="muted" className="shrink-0">
                  {stream.genre.replace('_', ' ')}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
