import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { SignalBars } from '@/components/brand/SignalBars'

interface Props { params: { streamId: string } }

async function getStream(streamId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/streams/${streamId}`, {
      next: { revalidate: 0 },
    })
    const data = await res.json()
    return data.success ? data.data : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stream = await getStream(params.streamId)
  if (!stream) return { title: 'Stream Not Found' }
  return {
    title: stream.title,
    description: `${stream.creator.displayName} is live on SeeWhy LIVE`,
    openGraph: {
      title: stream.title,
      images: stream.thumbnailUrl ? [stream.thumbnailUrl] : [],
    },
  }
}

export default async function LiveStreamPage({ params }: Props) {
  const stream = await getStream(params.streamId)
  if (!stream) notFound()

  const isLive = stream.status === 'LIVE'

  return (
    <div className="flex h-[calc(100vh-36px)] flex-col lg:flex-row">
      {/* Video / Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Video player placeholder */}
        <div className="relative aspect-video w-full bg-bg">
          {stream.thumbnailUrl && (
            <img src={stream.thumbnailUrl} alt={stream.title} className="h-full w-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            {isLive ? (
              <SignalBars active className="scale-[3]" />
            ) : (
              <p className="font-bebas text-page text-muted">STREAM ENDED</p>
            )}
          </div>

          {/* Live badge + viewer count */}
          {isLive && (
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <Badge variant="live" dot>LIVE</Badge>
              <span className="rounded bg-bg/70 px-2 py-0.5 font-bebas text-label text-text backdrop-blur-sm">
                {stream.viewerCount.toLocaleString()} watching
              </span>
            </div>
          )}
        </div>

        {/* Stream info */}
        <div className="border-b border-border p-4">
          <div className="flex items-start gap-3">
            <Avatar
              src={stream.creator.avatarUrl}
              alt={stream.creator.displayName}
              size={48}
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-bebas text-page text-text">{stream.title}</h1>
              <a
                href={`/${stream.creator.username}`}
                className="font-barlow text-body text-muted transition-colors hover:text-text"
              >
                {stream.creator.displayName}
              </a>
              {stream.description && (
                <p className="mt-1.5 font-barlow text-body text-muted/80">{stream.description}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Badge variant="muted">{stream.genre.replace('_', ' ')}</Badge>
              {stream.isPaywalled && <Badge variant="gold">PPV</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      <div className="h-64 w-full border-t border-border lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
        <ChatPanel streamId={stream.id} />
      </div>
    </div>
  )
}
