'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Btn } from '@/components/ui/Btn'

interface Room {
  id: string
  title: string
  isLive: boolean
  listenerCount: number
  createdAt: string
  host: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
}

export default function AudioRoomPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { roomId } = useParams<{ roomId: string }>()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    fetch(`/api/audio-rooms/${roomId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setRoom(d.data.room) })
      .finally(() => setLoading(false))
  }, [roomId])

  async function endRoom() {
    setEnding(true)
    await fetch(`/api/audio-rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLive: false }),
    })
    router.push('/rooms')
  }

  const isHost = session?.user?.id === room?.host.id

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-bebas text-page text-muted">ROOM NOT FOUND</p>
        <Btn variant="secondary" onClick={() => router.push('/rooms')}>Back to Rooms</Btn>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Room header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          {room.isLive && <Badge variant="live" dot>LIVE AUDIO</Badge>}
          {!room.isLive && <Badge variant="muted">ENDED</Badge>}
        </div>
        <h1 className="font-bebas text-hero text-text leading-none mb-2">{room.title}</h1>
        <div className="flex items-center justify-center gap-2">
          <Avatar src={room.host.avatarUrl} alt={room.host.displayName ?? room.host.username} size={24} />
          <a href={`/${room.host.username}`} className="font-barlow text-body text-muted hover:text-text transition-colors">
            {room.host.displayName ?? room.host.username}
          </a>
        </div>
      </div>

      {/* Audio stage placeholder */}
      {room.isLive && (
        <div className="mb-8 rounded border border-border bg-card p-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            {[1,2,3,4,5].map(i => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-accent"
                style={{
                  height: `${12 + Math.sin(i) * 8}px`,
                  animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
          <p className="font-bebas text-section tracking-widest text-muted mb-1">AUDIO STAGE</p>
          <p className="font-barlow text-body text-muted">
            {room.listenerCount.toLocaleString()} listening
          </p>
          <p className="mt-4 font-barlow text-caption text-muted/60">
            Real-time audio powered by your browser. Microphone access required to speak.
          </p>
        </div>
      )}

      {!room.isLive && (
        <div className="mb-8 rounded border border-border bg-card p-8 text-center">
          <p className="font-bebas text-page text-muted">THIS ROOM HAS ENDED</p>
        </div>
      )}

      {/* Host controls */}
      {isHost && room.isLive && (
        <div className="flex justify-center">
          <Btn variant="danger" onClick={endRoom} loading={ending}>
            End Room
          </Btn>
        </div>
      )}

      {!isHost && (
        <div className="flex justify-center">
          <Btn variant="secondary" onClick={() => router.push('/rooms')}>
            ← Back to Rooms
          </Btn>
        </div>
      )}
    </div>
  )
}
