'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'

export default function NewRoomPage() {
  const { status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'loading') return null
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  async function create() {
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/audio-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const d = await res.json()
      if (d.success) {
        router.push(`/rooms/${d.data.room.id}`)
      } else {
        setError(d.error?.message ?? 'Failed to create room')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-2 font-bebas text-hero text-text">START A ROOM</h1>
      <p className="mb-8 font-barlow text-body text-muted">Host a live audio conversation</p>

      <div className="space-y-5">
        <div>
          <label className="mb-1 block font-bebas text-label tracking-widest text-muted">ROOM TITLE</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What are we talking about?"
            maxLength={120}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') create() }}
          />
        </div>

        {error && <p className="font-barlow text-body text-red">{error}</p>}

        <Btn onClick={create} loading={loading} size="lg" className="w-full">
          GO LIVE
        </Btn>
        <Btn variant="ghost" size="lg" className="w-full" onClick={() => router.push('/rooms')}>
          Cancel
        </Btn>
      </div>
    </div>
  )
}
