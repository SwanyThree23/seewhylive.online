'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Btn } from '@/components/ui/Btn'

interface Props {
  userId: string
  username: string
}

export function ProfileActions({ userId, username }: Props) {
  const { data: session } = useSession()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

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
    <Btn
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      onClick={toggle}
      loading={loading}
    >
      {following ? 'FOLLOWING' : 'FOLLOW'}
    </Btn>
  )
}
