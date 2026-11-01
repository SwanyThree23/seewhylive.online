import Link from 'next/link'
import Image from 'next/image'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { SignalBars } from '@/components/brand/SignalBars'

interface StreamCardProps {
  stream: {
    id: string
    title: string
    genre: string
    thumbnailUrl?: string | null
    viewerCount: number
    isPaywalled: boolean
    creator: {
      username: string
      displayName: string
      avatarUrl?: string | null
    }
  }
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function StreamCard({ stream }: StreamCardProps) {
  return (
    <Link
      href={`/live/${stream.id}`}
      className="group relative flex flex-col overflow-hidden rounded border border-border bg-card transition-colors hover:border-border/70 hover:bg-cardHi"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface">
        {stream.thumbnailUrl ? (
          <Image
            src={stream.thumbnailUrl}
            alt={stream.title}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <SignalBars active className="scale-[2]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge variant="live" dot>LIVE</Badge>
          {stream.isPaywalled && <Badge variant="gold">PPV</Badge>}
        </div>

        {/* Viewer count */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-bg/70 px-1.5 py-0.5 backdrop-blur-sm">
          <span className="live-dot scale-75" />
          <span className="font-bebas text-label text-text">{formatViewers(stream.viewerCount)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-2.5 p-3">
        <Avatar src={stream.creator.avatarUrl} alt={stream.creator.displayName} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-barlow text-body font-semibold text-text">{stream.title}</p>
          <p className="truncate font-barlow text-label text-muted">{stream.creator.displayName}</p>
          <p className="mt-0.5 font-bebas text-label tracking-widest text-muted">{stream.genre.replace('_', ' ')}</p>
        </div>
      </div>
    </Link>
  )
}
