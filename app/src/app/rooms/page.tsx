import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

export const metadata: Metadata = {
  title: 'Audio Rooms — SeeWhy LIVE',
  description: 'Live audio conversations happening right now',
}

export const revalidate = 15

interface Room {
  id: string
  title: string
  isLive: boolean
  listenerCount: number
  createdAt: string
  host: { id: string; username: string; displayName: string | null; avatarUrl: string | null; tier: string }
}

async function getRooms(): Promise<Room[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/audio-rooms?live=1&limit=30`, {
      next: { revalidate: 15 },
    })
    const data = await res.json()
    return data.success ? data.data.rooms : []
  } catch {
    return []
  }
}

export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-hero text-text">AUDIO ROOMS</h1>
          <p className="font-barlow text-body text-muted">Live voice conversations</p>
        </div>
        <Link
          href="/rooms/new"
          className="rounded border border-accent bg-accent/10 px-4 py-2 font-bebas text-label tracking-widest text-accent transition-colors hover:bg-accent/20"
        >
          + START ROOM
        </Link>
      </div>

      {rooms.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-bebas text-page text-muted">NO ROOMS LIVE</p>
          <p className="mt-2 font-barlow text-body text-muted">Be the first to start a conversation.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map(room => (
            <div
              key={room.id}
              className="rounded border border-border bg-card p-5 transition-colors hover:border-accent/30"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={room.host.avatarUrl}
                    alt={room.host.displayName ?? room.host.username}
                    size={40}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/${room.host.username}`}
                      className="font-barlow text-body text-muted transition-colors hover:text-text"
                    >
                      {room.host.displayName ?? room.host.username}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="live" dot>LIVE</Badge>
                </div>
              </div>

              <p className="font-bebas text-section tracking-wide text-text mb-3 leading-tight">
                {room.title}
              </p>

              <div className="flex items-center justify-between">
                <span className="font-barlow text-caption text-muted">
                  {room.listenerCount.toLocaleString()} listening
                </span>
                <Link
                  href={`/rooms/${room.id}`}
                  className="font-bebas text-label tracking-widest text-accent hover:underline"
                >
                  JOIN →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
