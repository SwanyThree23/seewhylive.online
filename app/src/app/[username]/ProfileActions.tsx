'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Btn } from '@/components/ui/Btn'
import { SubscribeModal } from '@/components/payment/SubscribeModal'

interface Props {
  userId: string
  username: string
  displayName: string
}

export function ProfileActions({ userId, username, displayName }: Props) {
  const { data: session } = useSession()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subOpen, setSubOpen] = useState(false)

  useEffect(() => {
    if (!session || session.user.id === userId) return
    fetch(`/api/users/${username}/follow`)
      .then(r => r.json())
      .then(d => { if (d.success) setFollowing(d.data.following ?? false) })
      .catch(() => {})
  }, [session, userId, username])

  if (!session || session.user.id === userId) return null

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: following ? 'DELETE' : 'POST',
      })
      const d = await res.json()
      if (d.success) setFollowing(!following)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Btn
          variant={following ? 'secondary' : 'primary'}
          size="sm"
          onClick={toggle}
          loading={loading}
        >
          {following ? 'FOLLOWING' : 'FOLLOW'}
        </Btn>
        <Btn
          variant="gold"
          size="sm"
          onClick={() => setSubOpen(true)}
        >
          SUBSCRIBE
        </Btn>
      </div>

      <SubscribeModal
        open={subOpen}
        onClose={() => setSubOpen(false)}
        creatorId={userId}
        creatorName={displayName}
      />
    </>
  )
}
